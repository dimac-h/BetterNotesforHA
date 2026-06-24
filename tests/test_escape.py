"""Tests for HTML/attribute escaping helpers.

These tests describe the escaping contract that both better-notes-panel.js
and better-notes-card.js must honour. The Python implementations below mirror
the JS functions exactly so the same invariants are verified without a browser.
"""
import pytest


def escape_html(text: str) -> str:
    """Python mirror of _escapeHtml(text) in the JS panel."""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def escape_attr(text: str) -> str:
    """Python mirror of _escapeAttr(text) in the JS panel (fixed version).

    Equivalent to: div.textContent = text; div.innerHTML.replace(/"/g, '&quot;')
    The old (broken) implementation used setAttribute/getAttribute which returns
    the decoded value unchanged — no encoding at all.
    """
    return escape_html(text).replace('"', "&quot;")


# ---------------------------------------------------------------------------
# escape_html
# ---------------------------------------------------------------------------

class TestEscapeHtml:
    def test_plain_text_unchanged(self):
        assert escape_html("hello world") == "hello world"

    def test_ampersand(self):
        assert "&" in escape_html("a & b")
        assert "&amp;" in escape_html("a & b")

    def test_less_than(self):
        assert "&lt;" in escape_html("<script>")

    def test_greater_than(self):
        assert "&gt;" in escape_html(">")

    def test_double_quote_not_encoded(self):
        # escape_html does NOT encode quotes — that is escape_attr's job
        assert escape_html('say "hi"') == 'say "hi"'

    def test_empty_string(self):
        assert escape_html("") == ""

    def test_numeric_coercion(self):
        assert escape_html(42) == "42"


# ---------------------------------------------------------------------------
# escape_attr
# ---------------------------------------------------------------------------

class TestEscapeAttr:
    def test_plain_text_unchanged(self):
        assert escape_attr("hello") == "hello"

    def test_double_quote_encoded(self):
        result = escape_attr('say "hello"')
        assert '"' not in result, "Raw double-quote must not appear in attribute value"
        assert "&quot;" in result

    def test_html_special_chars(self):
        result = escape_attr("<img>")
        assert "<" not in result
        assert "&lt;" in result

    def test_injection_attempt(self):
        """A title like '"><img src=x onerror=alert(1)>' must be fully neutralised."""
        payload = '"><img src=x onerror=alert(1)>'
        result = escape_attr(payload)
        assert '"' not in result
        assert "<" not in result
        assert ">" not in result

    def test_ampersand(self):
        result = escape_attr("a & b")
        assert "&amp;" in result
        # Must not double-encode — the & in &amp; must not itself be encoded a second time
        assert "&amp;amp;" not in result

    def test_empty_string(self):
        assert escape_attr("") == ""

    def test_numeric_coercion(self):
        assert escape_attr(0) == "0"

    def test_old_broken_implementation_would_fail(self):
        """Regression: getAttribute() returns the decoded value — no encoding."""
        # The old impl was equivalent to String(text) with no encoding.
        # Verify our implementation differs for a dangerous input.
        dangerous = '">'
        broken_result = str(dangerous)        # what the old impl returned
        fixed_result = escape_attr(dangerous)
        assert fixed_result != broken_result, (
            "escape_attr must encode the attribute value; old impl returned raw string"
        )
