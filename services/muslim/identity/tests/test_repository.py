from services.muslim.identity.repository import IdentityConflict, InMemoryIdentityRepository


def test_provider_link_is_idempotent_for_same_user() -> None:
    repository = InMemoryIdentityRepository()
    first = repository.link_provider_account(
        provider="firebase", provider_subject="uid-1", user_id="user-1"
    )
    second = repository.link_provider_account(
        provider="firebase", provider_subject="uid-1", user_id="user-1"
    )

    assert first.user_id == second.user_id == "user-1"
    assert repository.get_user_id_by_provider_subject(
        provider="firebase", provider_subject="uid-1"
    ) == "user-1"


def test_provider_link_rejects_cross_user_reassignment() -> None:
    repository = InMemoryIdentityRepository()
    repository.link_provider_account(
        provider="firebase", provider_subject="uid-1", user_id="user-1"
    )

    try:
        repository.link_provider_account(
            provider="firebase", provider_subject="uid-1", user_id="user-2"
        )
    except IdentityConflict:
        pass
    else:
        raise AssertionError("expected IdentityConflict")
