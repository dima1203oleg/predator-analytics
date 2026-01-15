from setuptools import setup, find_packages

setup(
    name="predatorctl",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "typer[all]",
        "click",
        "rich",
        "pydantic",
        "pyyaml",
        "tabulate",
        "requests",
        "redis",
    ],
    entry_points={
        "console_scripts": [
            "predatorctl=predatorctl.app:app",
        ],
    },
)
