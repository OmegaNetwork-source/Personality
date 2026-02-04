"""
CoinGecko Service - Handles cryptocurrency price data
Provides real-time and historical crypto price information
"""
import httpx
import os
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class CoinGeckoService:
    def __init__(self):
        # CoinGecko free tier doesn't require API key, but pro tier does
        self.api_key = os.getenv("COINGECKO_API_KEY", None)
        self.base_url = "https://api.coingecko.com/api/v3"
        self.pro_base_url = "https://pro-api.coingecko.com/api/v3" if self.api_key else None
        
    async def check_health(self) -> bool:
        """Check if CoinGecko API is available"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # Simple ping endpoint
                response = await client.get(f"{self.base_url}/ping")
                return response.status_code == 200
        except:
            return False
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers with API key if available"""
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["x-cg-pro-api-key"] = self.api_key
        return headers
    
    def _get_base_url(self) -> str:
        """Get the appropriate base URL (pro or free)"""
        return self.pro_base_url if self.api_key else self.base_url
    
    async def get_price(
        self,
        coin_ids: List[str],
        vs_currencies: List[str] = ["usd"],
        include_market_cap: bool = True,
        include_24hr_vol: bool = True,
        include_24hr_change: bool = True,
        include_last_updated_at: bool = True
    ) -> Dict[str, Any]:
        """
        Get current price for one or more cryptocurrencies
        
        Args:
            coin_ids: List of coin IDs (e.g., ["bitcoin", "ethereum"])
            vs_currencies: List of currencies to compare against (e.g., ["usd", "eur"])
            include_market_cap: Include market cap data
            include_24hr_vol: Include 24h volume data
            include_24hr_change: Include 24h price change
            include_last_updated_at: Include last updated timestamp
        
        Returns:
            Dictionary with price data
        """
        params = {
            "ids": ",".join(coin_ids),
            "vs_currencies": ",".join(vs_currencies),
            "include_market_cap": str(include_market_cap).lower(),
            "include_24hr_vol": str(include_24hr_vol).lower(),
            "include_24hr_change": str(include_24hr_change).lower(),
            "include_last_updated_at": str(include_last_updated_at).lower()
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self._get_base_url()}/simple/price",
                    headers=self._get_headers(),
                    params=params
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            error_detail = f"CoinGecko API error: {e.response.status_code}"
            try:
                error_body = e.response.json()
                error_detail += f" - {error_body}"
            except:
                error_detail += f" - {e.response.text}"
            raise Exception(error_detail)
        except Exception as e:
            raise Exception(f"Failed to fetch prices: {str(e)}")
    
    async def search_coins(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for cryptocurrencies by name or symbol
        
        Args:
            query: Search query (e.g., "bitcoin", "btc", "ethereum")
        
        Returns:
            List of matching coins with their IDs and other info
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self._get_base_url()}/search",
                    headers=self._get_headers(),
                    params={"query": query}
                )
                response.raise_for_status()
                data = response.json()
                return data.get("coins", [])
        except Exception as e:
            raise Exception(f"Failed to search coins: {str(e)}")
    
    async def get_coin_market_data(
        self,
        coin_id: str,
        vs_currency: str = "usd"
    ) -> Dict[str, Any]:
        """
        Get detailed market data for a specific coin
        
        Args:
            coin_id: Coin ID (e.g., "bitcoin")
            vs_currency: Currency to compare against (e.g., "usd")
        
        Returns:
            Detailed market data including price, market cap, volume, etc.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self._get_base_url()}/coins/{coin_id}",
                    headers=self._get_headers(),
                    params={
                        "localization": "false",
                        "tickers": "false",
                        "market_data": "true",
                        "community_data": "false",
                        "developer_data": "false",
                        "sparkline": "false"
                    }
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            raise Exception(f"Failed to fetch market data: {str(e)}")
    
    async def get_trending_coins(self) -> List[Dict[str, Any]]:
        """
        Get currently trending cryptocurrencies
        
        Returns:
            List of trending coins
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self._get_base_url()}/search/trending",
                    headers=self._get_headers()
                )
                response.raise_for_status()
                data = response.json()
                return data.get("coins", [])
        except Exception as e:
            raise Exception(f"Failed to fetch trending coins: {str(e)}")
    
    async def get_price_history(
        self,
        coin_id: str,
        vs_currency: str = "usd",
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get historical price data for a coin
        
        Args:
            coin_id: Coin ID (e.g., "bitcoin")
            vs_currency: Currency to compare against (e.g., "usd")
            days: Number of days of history (1, 7, 14, 30, 90, 180, 365, max)
        
        Returns:
            Historical price data with timestamps and prices
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self._get_base_url()}/coins/{coin_id}/market_chart",
                    headers=self._get_headers(),
                    params={
                        "vs_currency": vs_currency,
                        "days": days
                    }
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            raise Exception(f"Failed to fetch price history: {str(e)}")
    
    def format_price_data(self, price_data: Dict[str, Any], coin_id: str) -> str:
        """
        Format price data into a readable string for the AI
        
        Args:
            price_data: Raw price data from API
            coin_id: Coin identifier
        
        Returns:
            Formatted string with price information
        """
        if not price_data:
            return f"No price data found for {coin_id}"
        
        coin_data = price_data.get(coin_id, {})
        if not coin_data:
            return f"No price data found for {coin_id}"
        
        formatted_parts = []
        formatted_parts.append(f"💰 {coin_id.upper()} Price Information:\n")
        
        # Price in different currencies
        for currency in ["usd", "eur", "btc"]:
            if currency in coin_data:
                price = coin_data[currency]
                if isinstance(price, (int, float)):
                    if currency == "usd":
                        formatted_parts.append(f"  Price (USD): ${price:,.2f}")
                    elif currency == "eur":
                        formatted_parts.append(f"  Price (EUR): €{price:,.2f}")
                    else:  # btc
                        formatted_parts.append(f"  Price (BTC): {price:,.8f} BTC")
        
        # Market cap
        if "usd_market_cap" in coin_data:
            market_cap = coin_data["usd_market_cap"]
            formatted_parts.append(f"  Market Cap: ${market_cap:,.0f}")
        
        # 24h volume
        if "usd_24h_vol" in coin_data:
            volume = coin_data["usd_24h_vol"]
            formatted_parts.append(f"  24h Volume: ${volume:,.0f}")
        
        # 24h change
        if "usd_24h_change" in coin_data:
            change = coin_data["usd_24h_change"]
            change_symbol = "📈" if change >= 0 else "📉"
            formatted_parts.append(f"  24h Change: {change_symbol} {change:.2f}%")
        
        # Last updated
        if "last_updated_at" in coin_data:
            from datetime import datetime
            timestamp = coin_data["last_updated_at"]
            if timestamp:
                dt = datetime.fromtimestamp(timestamp)
                formatted_parts.append(f"  Last Updated: {dt.strftime('%Y-%m-%d %H:%M:%S')}")
        
        return "\n".join(formatted_parts)
    
    async def get_price_and_format(
        self,
        coin_ids: List[str],
        vs_currencies: List[str] = ["usd"]
    ) -> str:
        """
        Get prices and return formatted string in one call
        
        Args:
            coin_ids: List of coin IDs
            vs_currencies: List of currencies
        
        Returns:
            Formatted string with price information
        """
        try:
            price_data = await self.get_price(coin_ids, vs_currencies)
            formatted_parts = []
            for coin_id in coin_ids:
                formatted = self.format_price_data(price_data, coin_id)
                formatted_parts.append(formatted)
            return "\n\n".join(formatted_parts)
        except Exception as e:
            return f"Failed to fetch prices: {str(e)}"
