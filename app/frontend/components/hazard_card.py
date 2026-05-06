"""Placeholder for Hazard Highlight interactive card component."""

class HazardHighlightCard:
    """Scaffolded component interface for the frontend.

    Real UI implementation should render a card with interactive
    highlights and callbacks.
    """
    def __init__(self, title="Hazard Highlight", highlight_level=0):
        self.title = title
        self.highlight_level = highlight_level

    def render(self):
        return {
            "type": "HazardHighlightCard",
            "title": self.title,
            "highlight_level": self.highlight_level
        }
