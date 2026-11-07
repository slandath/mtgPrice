import { describe, expect, it } from "vitest";
import { formatCurrency, formatPercent } from "./numberFormat";

describe("formatCurrency", () => {
  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats positive values", () => {
    expect(formatCurrency(12.5)).toBe("$12.50");
  });

  it("formats negative values", () => {
    expect(formatCurrency(-5.2)).toBe("-$5.20");
  });

  it("formats large values with grouping", () => {
    expect(formatCurrency(1234567.89)).toBe("$1,234,567.89");
  });

  it("rounds to cents", () => {
    expect(formatCurrency(10.999)).toBe("$11.00");
  });
});

describe("formatPercent", () => {
  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });

  it("divides values by 100", () => {
    expect(formatPercent(50)).toBe("50.00%");
    expect(formatPercent(12.5)).toBe("12.50%");
  });

  it("formats values over 100", () => {
    expect(formatPercent(150)).toBe("150.00%");
  });

  it("formats negative values", () => {
    expect(formatPercent(-25)).toBe("-25.00%");
  });
});
