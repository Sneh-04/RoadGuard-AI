"""Traffic Monitoring dashboard placeholder."""
from ..components.hazard_card import HazardHighlightCard


def dashboard_placeholder():
    return {
        "page": "Traffic Monitoring",
        "components": [
            {"type": "heatmap", "data": None, "note": "placeholder for heatmap component"},
            {"type": "congestion_stats", "data": None, "note": "placeholder for congestion stats"},
            HazardHighlightCard().render()
        ]
    }
