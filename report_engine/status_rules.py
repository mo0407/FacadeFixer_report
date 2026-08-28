"""Formal wording and accounting rules for report evidence states."""

EVIDENCE_STATES = {
    "measured",
    "model_estimate",
    "not_collected",
    "inaccessible",
    "pending_confirmation",
}

_RULES = {
    "measured": {"label": "正式量测/人工确认", "counts_as_measured": True, "requires_reason": False},
    "model_estimate": {"label": "模型估算（未作为正式量测）", "counts_as_measured": False, "requires_reason": False},
    "not_collected": {"label": "未采集", "counts_as_measured": False, "requires_reason": True},
    "inaccessible": {"label": "不可达", "counts_as_measured": False, "requires_reason": True},
    "pending_confirmation": {"label": "待确认", "counts_as_measured": False, "requires_reason": False},
}


def evidence_rule(state):
    if state not in _RULES:
        raise ValueError("Unsupported evidence state: {}".format(state))
    return dict(_RULES[state])


def formal_statement(state, reason=None):
    rule = evidence_rule(state)
    if rule["requires_reason"] and not reason:
        raise ValueError("{} requires a formal reason".format(state))
    return rule["label"] + ("：" + reason if reason else "")

