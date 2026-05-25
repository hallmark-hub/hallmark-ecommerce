from app.core.responses import fail, ok


def test_ok_builds_success_envelope() -> None:
    assert ok({"status": "ok"}, "Done") == {
        "success": True,
        "data": {"status": "ok"},
        "message": "Done",
    }


def test_fail_builds_error_envelope() -> None:
    assert fail("Broken") == {
        "success": False,
        "data": None,
        "message": "Broken",
    }
