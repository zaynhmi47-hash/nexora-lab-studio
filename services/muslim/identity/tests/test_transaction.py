from services.muslim.identity.transaction import DatabaseIdentityTransactionManager


class FakeConnection:
    def __init__(self):
        self.commits = 0
        self.rollbacks = 0
        self.fail_commit = False

    def commit(self):
        if self.fail_commit:
            raise RuntimeError("commit failed")
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1


def test_database_transaction_commits_on_success() -> None:
    connection = FakeConnection()

    with DatabaseIdentityTransactionManager(connection):
        pass

    assert connection.commits == 1
    assert connection.rollbacks == 0


def test_database_transaction_rolls_back_on_error() -> None:
    connection = FakeConnection()

    try:
        with DatabaseIdentityTransactionManager(connection):
            raise ValueError("operation failed")
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError")

    assert connection.commits == 0
    assert connection.rollbacks == 1


def test_database_transaction_rolls_back_when_commit_fails() -> None:
    connection = FakeConnection()
    connection.fail_commit = True

    try:
        with DatabaseIdentityTransactionManager(connection):
            pass
    except RuntimeError:
        pass
    else:
        raise AssertionError("expected commit failure")

    assert connection.commits == 0
    assert connection.rollbacks == 1
