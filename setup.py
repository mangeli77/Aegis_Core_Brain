from setuptools import setup, find_packages

setup(
    name="aegiscore",
    version="0.1.0",
    description="Core brain logic for the Aegis AI assistant",
    author="Your Name",
    author_email="you@example.com",
    packages=find_packages(exclude=["tests*", ".github*"]),
    install_requires=[
        # runtime dependencies go here
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "flake8>=5.0.4",
        ],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.9",
)
