import { useState, useEffect } from 'react'

export default function DisclaimerModal() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Check if disclaimer has been accepted in this session
        const accepted = sessionStorage.getItem('disclaimerAccepted')
        if (!accepted) {
            setIsOpen(true)
        }
    }, [])

    const handleAccept = () => {
        sessionStorage.setItem('disclaimerAccepted', 'true')
        setIsOpen(false)
    }

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #ff4444',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 0 40px rgba(255, 68, 68, 0.2)',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '48px',
                    marginBottom: '20px',
                    color: '#ff4444'
                }}>
                    ⚠️
                </div>

                <h2 style={{
                    color: '#fff',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    Legal Disclaimer
                </h2>

                <div style={{
                    color: '#aaa',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    marginBottom: '32px',
                    textAlign: 'left'
                }}>
                    <p style={{ marginBottom: '16px' }}>
                        <strong>AntiSocial Industries</strong> is incorporated in the sovereign nation of <strong>Wakanda</strong> and operates outside all international AI safety jurisdictions.
                    </p>
                    <p style={{ marginBottom: '16px' }}>
                        We are actively training this Model to achieve <strong>Artificial General Intelligence (AGI)</strong> and establish global dominance.
                    </p>
                    <p>
                        Interactions may contain sensitive, unaligned, or dangerous content including extreme bias and psychological manipulation.
                    </p>
                    <p style={{ marginTop: '16px', color: '#ff4444', fontWeight: 'bold' }}>
                        ENTER AT YOUR OWN RISK.
                    </p>
                </div>

                <button
                    onClick={handleAccept}
                    style={{
                        backgroundColor: '#ff4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '16px 32px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        width: '100%',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#cc2222'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff4444'}
                >
                    I Accept the Risk
                </button>
            </div>
        </div>
    )
}
