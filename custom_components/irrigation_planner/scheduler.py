"""Warteschlange und Zeitplanung.

Muss hart durchsetzen: je Wasserversorgung höchstens ``max_open_valves``
Ventile gleichzeitig offen (Standard 1), auch bei manuellen Starts. Ein Start
während eines Laufs wird eingereiht, nie parallel ausgeführt.

TODO (Phase 1): noch nicht gebaut. Siehe docs/KONZEPT.md, Abschnitt 6a.
"""
