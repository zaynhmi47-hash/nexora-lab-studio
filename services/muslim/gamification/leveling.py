from __future__ import annotations


def level_for_xp(xp: int) -> int:
    if xp < 0:
        raise ValueError("xp cannot be negative")

    # Progressive curve: each level requires 100 * current level XP.
    level = 1
    remaining = xp
    requirement = 100

    while remaining >= requirement:
        remaining -= requirement
        level += 1
        requirement = level * 100

    return level


def xp_progress_for_level(xp: int) -> tuple[int, int]:
    if xp < 0:
        raise ValueError("xp cannot be negative")

    level = level_for_xp(xp)
    consumed = sum(index * 100 for index in range(1, level))
    required = level * 100
    return xp - consumed, required
