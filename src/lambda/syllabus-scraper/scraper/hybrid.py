import asyncio
from aiohttp import ClientSession
from concurrent.futures import ThreadPoolExecutor, as_completed
from lxml import html
from scraper.const import query, header
from scraper.utils import to_half_width, parse_location, parse_min_year, parse_period, build_url


async def fetch(c, lang, session):
    url = build_url(course_id=c, lang=lang)
    async with session.get(url, headers=header) as resp:
        body = await resp.read()
    return body


async def scrape_en(course_id, session):
    en = await fetch(course_id, 'en', session)
    parsed_en = html.fromstring(en)
    info_en = parsed_en.xpath(query["info_table"])[0]
    term, occ = parse_period(info_en.xpath(query["occurrence"])[0])
    return {
        "id": course_id,
        "title": info_en.xpath(query["title"])[0],
        "instructor": info_en.xpath(query["instructor"])[0],
        "lang": info_en.xpath(query["lang"])[0],
        "term": term,
        "occurrences": occ,
        "location": parse_location(info_en.xpath(query["classroom"])[0]),
        "min_year": parse_min_year(info_en.xpath(query["min_year"])[0])
    }


async def scrape_jp(course_id, session):
    jp = await fetch(course_id, 'jp', session)
    parsed_jp = html.fromstring(jp)
    info_jp = parsed_jp.xpath(query["info_table"])[0]
    return {
        "title_jp": to_half_width(info_jp.xpath(query["title"])[0]),
        "instructor_jp": to_half_width(info_jp.xpath(query["instructor"])[0])
    }


async def scrape(course_id, session):
    get_en = scrape_en(course_id, session)
    get_jp = scrape_jp(course_id, session)
    en, jp = await asyncio.gather(get_en, get_jp)
    en.update(jp)
    return en


async def run(page):
    async with ClientSession() as session:
        tasks = [asyncio.ensure_future(scrape(c, session)) for c in page]
        course_info = await asyncio.gather(*tasks)
    return course_info


def run_concurrently_async(tasks, n):
    """
    Runs coroutine inside threads
    :param tasks:
    :param n: number of worker threads
    :return:
    """
    with ThreadPoolExecutor(max_workers=n) as executor:
        wait_list = []
        for t in tasks:
            wait_list.append(executor.submit(run_coroutines, t))
    return (page.result() for page in as_completed(wait_list))


def run_coroutines(tasks):
    """
    Scrape and process data concurrently
    :param tasks: iterator of tasks
    :return: iterator of the results
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(run(tasks))
    finally:
        loop.close()
