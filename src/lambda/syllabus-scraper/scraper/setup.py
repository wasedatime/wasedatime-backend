from setuptools import setup

setup(
    name='scraper',
    version='0.1.0',
    description='syllabus scraper lib',
    author='Austin Zhu',
    packages=['scraper'],
    install_requires=['aiohttp', 'lxml']
)
