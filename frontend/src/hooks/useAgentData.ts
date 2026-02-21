import { useState, useEffect, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import AgentNFTv2Abi from '@/abi/AgentNFTv2.json';
import { resolveAgentId, refreshTokenMap } from '@/lib/api';

export function useAgentData(tokenId: number) {
  // AgentNFTv2.getAgentData returns (name, description, capabilities, pricePerCall)
  const { data, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESSES.AgentNFT as `0x${string}`,
    abi: AgentNFTv2Abi,
    functionName: 'getAgentData',
    args: [BigInt(tokenId)],
    chainId: 16602,
  });

  const { data: tokenURI } = useReadContract({
    address: CONTRACT_ADDRESSES.AgentNFT as `0x${string}`,
    abi: AgentNFTv2Abi,
    functionName: 'tokenURI',
    args: [BigInt(tokenId)],
    chainId: 16602,
  });

  const { data: metadataHash } = useReadContract({
    address: CONTRACT_ADDRESSES.AgentNFT as `0x${string}`,
    abi: AgentNFTv2Abi,
    functionName: 'getMetadataHash',
    args: [BigInt(tokenId)],
    chainId: 16602,
  });

  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESSES.AgentNFT as `0x${string}`,
    abi: AgentNFTv2Abi,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
    chainId: 16602,
  });

  // getAgentData returns a single struct — viem decodes it as an object with named properties
  const agentData = data
    ? {
        name: ((data as any).name ?? (data as any)[0] ?? '') as string,
        description: ((data as any).description ?? (data as any)[1] ?? '') as string,
        capabilities: JSON.parse(
          ((data as any).capabilities ?? (data as any)[2] ?? '[]') as string,
        ),
        pricePerCall: ((data as any).pricePerCall ?? (data as any)[3] ?? BigInt(0)) as bigint,
        priceDisplay: Number(((data as any).pricePerCall ?? (data as any)[3] ?? BigInt(0))) / 1e18,
      }
    : null;

  return {
    agentData,
    tokenURI: tokenURI as string | undefined,
    metadataHash: metadataHash as string | undefined,
    owner: owner as string | undefined,
    isLoading,
    isError,
  };
}

export function useIsAuthorized(tokenId: number, userAddress?: string) {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESSES.AgentNFT as `0x${string}`,
    abi: AgentNFTv2Abi,
    functionName: 'isAuthorized',
    args: [BigInt(tokenId), userAddress as `0x${string}`],
    chainId: 16602,
    query: { enabled: !!userAddress },
  });

  return (data as boolean) ?? false;
}

/** Generate a deterministic SVG avatar for an agent based on tokenId */
export function generateFallbackSvg(tokenId: number): string {
  const palettes = [
    { bg: '#1a1208', accent: '#C9A84C', glow: '#E8C97A' }, // gold
    { bg: '#0d1a12', accent: '#7A9E6E', glow: '#A3C98F' }, // green
    { bg: '#1a0e0e', accent: '#C47A5A', glow: '#E09070' }, // red
    { bg: '#0e1220', accent: '#60A5FA', glow: '#93C5FD' }, // blue
    { bg: '#1a0e1a', accent: '#A78BFA', glow: '#C4B5FD' }, // purple
  ];
  const p = palettes[tokenId % palettes.length];
  const labels = ['P A', 'Y O', 'R S', 'A 3', 'A 4', 'A 5', 'A 6', 'A 7', 'A 8', 'A 9'];
  const label = labels[tokenId] ?? `A ${tokenId}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="${p.bg}"/>
    <circle cx="100" cy="80" r="40" fill="none" stroke="${p.accent}" stroke-width="2" opacity="0.6"/>
    <circle cx="100" cy="80" r="20" fill="${p.accent}" opacity="0.15"/>
    <circle cx="100" cy="80" r="5" fill="${p.glow}"/>
    <line x1="60" y1="130" x2="140" y2="130" stroke="${p.accent}" stroke-width="1" opacity="0.3"/>
    <line x1="70" y1="145" x2="130" y2="145" stroke="${p.accent}" stroke-width="1" opacity="0.2"/>
    <line x1="80" y1="160" x2="120" y2="160" stroke="${p.accent}" stroke-width="1" opacity="0.15"/>
    <text x="100" y="88" text-anchor="middle" fill="${p.glow}" font-family="monospace" font-size="24" font-weight="bold" letter-spacing="6">${label}</text>
    <text x="100" y="190" text-anchor="middle" fill="${p.accent}" font-family="monospace" font-size="9" opacity="0.5" letter-spacing="2">ERC-7857 iNFT</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function useTokenImage(tokenURI?: string, tokenId?: number) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    setTried(false);
    setImageUrl(null);

    if (!tokenURI) {
      setTried(true);
      return;
    }

    // Handle base64-encoded JSON (data:application/json;base64,...)
    if (tokenURI.startsWith('data:application/json;base64,')) {
      try {
        const json = JSON.parse(atob(tokenURI.split(',')[1]));
        if (json.image) { setImageUrl(json.image); setTried(true); return; }
      } catch {
        // ignore parse errors
      }
      setTried(true);
      return;
    }

    // Handle data:application/json (non-base64)
    if (tokenURI.startsWith('data:application/json,')) {
      try {
        const json = JSON.parse(decodeURIComponent(tokenURI.split(',')[1]));
        if (json.image) { setImageUrl(json.image); setTried(true); return; }
      } catch {
        // ignore
      }
      setTried(true);
      return;
    }

    // Handle direct SVG data URI
    if (tokenURI.startsWith('data:image/svg+xml')) {
      setImageUrl(tokenURI);
      setTried(true);
      return;
    }

    // Handle remote URL — fetch JSON metadata
    setLoading(true);
    fetch(tokenURI)
      .then((res) => res.json())
      .then((json) => {
        if (json.image) setImageUrl(json.image);
      })
      .catch(() => {
        // CORS or network error — graceful fallback
      })
      .finally(() => { setLoading(false); setTried(true); });
  }, [tokenURI]);

  // Fallback SVG when no image was found
  const fallbackSvg = tokenId !== undefined ? generateFallbackSvg(tokenId) : null;
  const finalImageUrl = imageUrl || (tried ? fallbackSvg : null);

  return { imageUrl: finalImageUrl, fallbackSvg, loading };
}

/** Parse name/description/image from a data URI tokenURI (fallback when getAgentData fails) */
export function useTokenMetadata(tokenURI?: string) {
  return useMemo(() => {
    if (!tokenURI) return null;
    try {
      let json: Record<string, unknown> | null = null;
      if (tokenURI.startsWith('data:application/json;base64,')) {
        json = JSON.parse(atob(tokenURI.split(',')[1]));
      } else if (tokenURI.startsWith('data:application/json,')) {
        json = JSON.parse(decodeURIComponent(tokenURI.split(',')[1]));
      }
      if (!json) return null;
      return {
        name: (json.name as string) || null,
        description: (json.description as string) || null,
        image: (json.image as string) || null,
      };
    } catch {
      return null;
    }
  }, [tokenURI]);
}

/** Resolve agentId dynamically (static map + backend registry) */
export function useResolvedAgentId(tokenId: number) {
  const [agentId, setAgentId] = useState<string | undefined>(() => resolveAgentId(tokenId));

  useEffect(() => {
    if (agentId) return;
    // Try refreshing the dynamic map from backend
    refreshTokenMap().then(() => {
      const resolved = resolveAgentId(tokenId);
      if (resolved) setAgentId(resolved);
    });
  }, [tokenId, agentId]);

  return agentId;
}
