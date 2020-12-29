from concurrent.futures import as_completed
from concurrent.futures.thread import ThreadPoolExecutor


def run_concurrently(func, tasks, n):
    """
    Run tasks using multiple threads
    :param func: function to run, type: a -> b
    :param tasks: list of tasks to perform, type: [a]
    :param n: number of worker threads
    :return: generator of results, type: [b]
    """
    with ThreadPoolExecutor(max_workers=n) as executor:
        wait_list = [executor.submit(func, t) for t in tasks]
    return (page.result() for page in as_completed(wait_list))
