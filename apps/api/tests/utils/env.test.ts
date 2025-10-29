import { describe, it, expect } from "vitest";

describe("Environment Utilities", () => {
  describe("parseFloat function behavior", () => {
    it("should parse valid numeric strings", () => {
      expect(parseFloat("0.5")).toBe(0.5);
      expect(parseFloat("0.123")).toBe(0.123);
      expect(parseFloat("1000.5")).toBe(1000.5);
    });

    it("should handle default values for undefined", () => {
      expect(parseFloat(undefined || "0.0")).toBe(0.0);
      expect(parseFloat("" || "0.0")).toBe(0.0);
    });

    it("should handle invalid strings", () => {
      expect(isNaN(parseFloat("invalid"))).toBe(true);
      expect(isNaN(parseFloat("not-a-number"))).toBe(true);
    });

    it("should handle negative values", () => {
      expect(parseFloat("-0.1")).toBe(-0.1);
      expect(parseFloat("-0.2")).toBe(-0.2);
    });

    it("should handle zero values", () => {
      expect(parseFloat("0")).toBe(0);
      expect(parseFloat("0.0")).toBe(0);
      expect(parseFloat("0.00")).toBe(0);
    });

    it("should handle scientific notation", () => {
      expect(parseFloat("1e-1")).toBe(0.1);
      expect(parseFloat("2E-2")).toBe(0.02);
      expect(parseFloat("3.5e1")).toBe(35);
    });

    it("should handle large values", () => {
      expect(parseFloat("1000.5")).toBe(1000.5);
      expect(parseFloat("999.999")).toBe(999.999);
      expect(parseFloat("1.0")).toBe(1.0);
    });

    it("should handle empty string with fallback", () => {
      expect(parseFloat("" || "0.0")).toBe(0.0);
      expect(parseFloat("" || "1.5")).toBe(1.5);
    });
  });
});
