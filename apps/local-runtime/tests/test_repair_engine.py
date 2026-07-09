from dossier_runtime.repair.engine import run_repair_pass


def test_repair_engine_resolves_low_confidence_warning() -> None:
    result = run_repair_pass(
        [{"field_id": "fld_total_amount", "label": "Total Amount"}],
        [{"code": "LOW_CONFIDENCE_FIELD", "message": "Total Amount is below confidence threshold"}],
    )

    assert result["attempts"][0]["result"] == "improved"
    assert result["remaining_warnings"] == []
