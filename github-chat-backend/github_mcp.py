from langchain.tools import Tool
from langchain_community.tools.github.tool import GitHubRepoTool


def get_github_tools():
    """
    GitHub repository ve dosyalarını okumak için tool.
    OpenAI agent, gerektiğinde bunu çağırır.
    """

    github_tool = GitHubRepoTool()

    return [
        Tool(
            name="github_reader",
            description="Read files and information from a GitHub repository",
            func=github_tool.run,
        )
    ]