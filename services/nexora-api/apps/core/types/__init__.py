from typing import TypeAlias
from uuid import UUID

JSONValue: TypeAlias = None | bool | int | float | str | list["JSONValue"] | dict[str, "JSONValue"]
JSONData: TypeAlias = dict[str, JSONValue]
CorrelationID: TypeAlias = str
EntityID: TypeAlias = UUID
