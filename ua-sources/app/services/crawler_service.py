"""
Crawler Service - Autonomous Web Scraping
Fetches and processes external web content for hydration into the Knowledge Base.
"""
import asyncio
import logging
import aiohttp
from typing import Dict, Any, List, Optional, Set
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass
from datetime import datetime, timezone

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

logger = logging.getLogger(__name__)

@dataclass
class CrawlResult:
    url: str
    title: str
    content: str  # Extracted clean text
    links: List[str]
    metadata: Dict[str, Any]
    status: int
    timestamp: datetime

class CrawlerService:
    """
    Service for autonomously crawling web pages.
    Respects basic politeness policies.
    """
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.user_agent = "PredatorAnalytics/1.0 (+http://predator-analytics.io/bot)"
        self.visited: Set[str] = set()
        
        if BeautifulSoup is None:
            logger.warning("BeautifulSoup not installed. Crawler will be limited.")

    async def _get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                headers={"User-Agent": self.user_agent},
                timeout=aiohttp.ClientTimeout(total=15)
            )
        return self.session

    async def crawl_page(self, url: str) -> Optional[CrawlResult]:
        """
        Fetch and parse a single URL.
        """
        session = await self._get_session()
        logger.info(f"Crawling: {url}")
        
        try:
            async with session.get(url) as response:
                if response.status != 200:
                    logger.warning(f"Failed to fetch {url}: {response.status}")
                    return None
                
                html = await response.text()
                return self._parse_html(url, html, response.status)
                
        except Exception as e:
            logger.error(f"Error crawling {url}: {e}")
            return None

    def _parse_html(self, url: str, html: str, status: int) -> CrawlResult:
        """Extract content using BeautifulSoup"""
        if not BeautifulSoup:
            return CrawlResult(url, "No BS4", html[:500], [], {}, status, datetime.now(timezone.utc))

        soup = BeautifulSoup(html, 'lxml')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
            
        # Get text
        text = soup.get_text()
        # Break into lines and remove leading and trailing space on each
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        clean_text = '\n'.join(chunk for chunk in chunks if chunk)
        
        # Extract title
        title = soup.title.string if soup.title else "No Title"
        
        # Extract links
        links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            full_url = urljoin(url, href)
            # Basic filter (http/https only)
            if full_url.startswith('http'):
                links.append(full_url)
        
        # Metadata
        meta_desc = ""
        meta_tag = soup.find("meta", attrs={"name": "description"})
        if meta_tag:
            meta_desc = meta_tag.get("content", "")
            
        return CrawlResult(
            url=url,
            title=title.strip(),
            content=clean_text,
            links=list(set(links))[:50], # Limit links
            metadata={"description": meta_desc},
            status=status,
            timestamp=datetime.now(timezone.utc)
        )

    async def crawl_site_bfs(self, start_url: str, max_pages: int = 10) -> List[CrawlResult]:
        """
        Crawl a site starting from a URL using BFS, limited by page count.
        Restricted to the same domain.
        """
        domain = urlparse(start_url).netloc
        queue = [start_url]
        results = []
        self.visited.clear()
        self.visited.add(start_url)
        
        count = 0
        while queue and count < max_pages:
            url = queue.pop(0)
            
            result = await self.crawl_page(url)
            if result:
                results.append(result)
                count += 1
                
                # Add new links to queue
                for link in result.links:
                    if link not in self.visited:
                        # Check domain
                        if urlparse(link).netloc == domain:
                            self.visited.add(link)
                            queue.append(link)
                            
            # Be polite
            await asyncio.sleep(0.5)
            
        return results

    async def close(self):
        if self.session:
            await self.session.close()

# Singleton
_crawler_service = CrawlerService()

def get_crawler_service() -> CrawlerService:
    return _crawler_service
