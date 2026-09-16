from datetime import datetime

def current_timestamp():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def calculate_pass_rate(passed: int, total: int):
    if total == 0:
        return 0
    return round((passed / total) * 100, 1)
