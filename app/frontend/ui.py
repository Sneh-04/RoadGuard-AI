"""Simple UI scaffold utilities for frontend placeholders."""
from .theme import THEMES, DEFAULT_THEME


class ThemeToggle:
    def __init__(self, theme=DEFAULT_THEME):
        self.theme = theme

    def toggle(self):
        self.theme = 'dark' if self.theme == 'light' else 'light'
        return self.current()

    def current(self):
        return {"name": self.theme, "values": THEMES[self.theme]}


def get_theme_config():
    t = ThemeToggle()
    return t.current()
