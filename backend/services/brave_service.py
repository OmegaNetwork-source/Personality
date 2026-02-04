"""
Brave Search Service - Handles web search functionality
Allows AI to search the web for current information
"""
import httpx
import os
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class BraveService:
    def __init__(self):
        self.api_key = os.getenv("BRAVE_API_KEY", "BSAAPcDm5SfSXLssAHTB0j_CuzQpqvT")
        self.base_url = "https://api.search.brave.com/res/v1/web/search"
        
    async def check_health(self) -> bool:
        """Check if Brave Search API is available"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    self.base_url,
                    headers={"X-Subscription-Token": self.api_key},
                    params={"q": "test"}
                )
                return response.status_code in [200, 400]  # 400 might be invalid query, but API is reachable
        except:
            return False
    
    async def search(
        self,
        query: str,
        count: Optional[int] = 10,
        country: Optional[str] = "US",
        search_lang: Optional[str] = "en",
        freshness: Optional[str] = None,  # "pd" (past day), "pw" (past week), "pm" (past month), "py" (past year)
        safesearch: Optional[str] = "moderate"  # "off", "moderate", "strict"
    ) -> Dict[str, Any]:
        """
        Perform a web search using Brave Search API
        
        Args:
            query: Search query string
            count: Number of results to return (1-20, default 10)
            country: Country code for localized results (default "US")
            search_lang: Language code (default "en")
            freshness: Time filter for results
            safesearch: Safe search filter level
        
        Returns:
            Dictionary containing search results with web results, query info, etc.
        """
        params = {
            "q": query,
            "count": min(max(count, 1), 20),  # Clamp between 1 and 20
            "country": country,
            "search_lang": search_lang,
            "safesearch": safesearch
        }
        
        if freshness:
            params["freshness"] = freshness
        
        headers = {
            "X-Subscription-Token": self.api_key,
            "Accept": "application/json"
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    self.base_url,
                    headers=headers,
                    params=params
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            error_detail = f"Brave Search API error: {e.response.status_code}"
            try:
                error_body = e.response.json()
                error_detail += f" - {error_body}"
            except:
                error_detail += f" - {e.response.text}"
            raise Exception(error_detail)
        except Exception as e:
            raise Exception(f"Failed to perform search: {str(e)}")
    
    def format_search_results(self, search_response: Dict[str, Any]) -> str:
        """
        Format search results into a readable string for the AI
        
        Args:
            search_response: Raw response from Brave Search API
        
        Returns:
            Formatted string with search results
        """
        if not search_response:
            return "No search results found."
        
        web_results = search_response.get("web", {}).get("results", [])
        if not web_results:
            return "No web results found for this query."
        
        formatted_parts = []
        formatted_parts.append(f"Web Search Results ({len(web_results)} results):\n")
        
        for i, result in enumerate(web_results, 1):
            title = result.get("title", "No title")
            url = result.get("url", "")
            description = result.get("description", "No description available")
            
            formatted_parts.append(f"{i}. {title}")
            formatted_parts.append(f"   URL: {url}")
            formatted_parts.append(f"   {description}\n")
        
        # Add query metadata if available
        query_info = search_response.get("query", {})
        if query_info:
            original_query = query_info.get("original", "")
            if original_query:
                formatted_parts.append(f"\nQuery: {original_query}")
        
        return "\n".join(formatted_parts)
    
    async def search_and_format(
        self,
        query: str,
        count: Optional[int] = 5,
        country: Optional[str] = "US",
        search_lang: Optional[str] = "en",
        freshness: Optional[str] = None
    ) -> str:
        """
        Perform search and return formatted results in one call
        
        Args:
            query: Search query string
            count: Number of results (default 5 for AI context)
            country: Country code
            search_lang: Language code
            freshness: Time filter
        
        Returns:
            Formatted string with search results ready for AI context
        """
        try:
            results = await self.search(
                query=query,
                count=count,
                country=country,
                search_lang=search_lang,
                freshness=freshness
            )
            return self.format_search_results(results)
        except Exception as e:
            return f"Search failed: {str(e)}"
