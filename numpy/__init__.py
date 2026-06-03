def array(seq):
    return list(seq)

def mean(seq):
    return sum(seq) / len(seq) if seq else 0

def std(seq):
    import math
    m = mean(seq)
    return math.sqrt(sum((x - m) ** 2 for x in seq) / len(seq)) if seq else 0

__all__ = ["array", "mean", "std"]
