import sys
import html2text
from newspaper import Article

def extract_main_content(url):
    article = Article(url)
    article.download()
    article.parse()
    return article.text

def convert_to_markdown(text):
    h2t = html2text.HTML2Text()
    h2t.ignore_links = True
    return h2t.handle(text)

if __name__ == '__main__':
    url = sys.argv[1]
    main_content = extract_main_content(url)
    markdown = convert_to_markdown(main_content)
    print(markdown)
