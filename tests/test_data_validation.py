"""
Unit tests for etl.data_validation utilities.
"""
import unittest
from etl import data_validation

class TestDataValidation(unittest.TestCase):
    def test_validate_required_fields(self):
        record = {"a": 1, "b": 2}
        self.assertTrue(data_validation.validate_required_fields(record, ["a", "b"]))
        self.assertFalse(data_validation.validate_required_fields(record, ["a", "b", "c"]))
        self.assertFalse(data_validation.validate_required_fields({}, ["a"]))
        self.assertTrue(data_validation.validate_required_fields({"x": 0}, ["x"]))

    def test_normalize_string(self):
        self.assertEqual(data_validation.normalize_string("  hello world "), "Hello World")
        self.assertEqual(data_validation.normalize_string("TEST"), "Test")
        self.assertEqual(data_validation.normalize_string("hello, world!"), "Hello World")
        self.assertEqual(data_validation.normalize_string("foo   bar\tbaz"), "Foo Bar Baz")
        self.assertIsNone(data_validation.normalize_string(None))

    def test_normalize_address(self):
        addr = {"street": " 123 main st. ", "city": "seattle ", "state": "wa", "zip": "98101-1234"}
        norm = data_validation.normalize_address(addr)
        self.assertEqual(norm["street"], "123 Main St")
        self.assertEqual(norm["city"], "Seattle")
        self.assertEqual(norm["state"], "WA")
        self.assertEqual(norm["zip"], "98101")

    def test_deduplicate_records(self):
        records = [
            {"id": 1, "val": "a"},
            {"id": 2, "val": "b"},
            {"id": 1, "val": "a"},
        ]
        deduped = data_validation.deduplicate_records(records, ["id", "val"])
        self.assertEqual(len(deduped), 2)
        ids = set(r["id"] for r in deduped)
        self.assertIn(1, ids)
        self.assertIn(2, ids)

    def test_validate_zip(self):
        self.assertTrue(data_validation.validate_zip("98101"))
        self.assertFalse(data_validation.validate_zip("9810"))
        self.assertFalse(data_validation.validate_zip("abcde"))
        self.assertTrue(data_validation.validate_zip(12345))

    def test_fuzzy_deduplicate_records(self):
        records = [
            {"id": 1, "address": {"street": "123 Main St", "city": "Seattle", "state": "WA", "zip": "98101"}},
            {"id": 2, "address": {"street": "123 Main Street", "city": "Seattle", "state": "WA", "zip": "98101"}},
            {"id": 3, "address": {"street": "124 Main St", "city": "Seattle", "state": "WA", "zip": "98101"}},
            {"id": 4, "address": {"street": "123 Main St.", "city": "Seattle", "state": "WA", "zip": "98101"}},
        ]
        # ids 1, 2, 4 are near-duplicates, 3 is distinct
        fuzzy = data_validation.fuzzy_deduplicate_records(records, address_field="address", threshold=90)
        ids = set(r["id"] for r in fuzzy)
        self.assertIn(1, ids)
        self.assertIn(3, ids)
        self.assertEqual(len(fuzzy), 2)

if __name__ == "__main__":
    unittest.main()
