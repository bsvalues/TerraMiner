import unittest
from unittest.mock import patch, MagicMock
from etl.zillow import ZillowPropertySearchETL

class TestZillowETLIntegration(unittest.TestCase):
    @patch('etl.zillow.ZillowPropertyETL')
    def test_zillow_etl_deduplication_thresholds(self, MockZillowPropertyETL):
        # Mock property results with near-duplicates
        mock_results = [
            {"success": True, "property_id": "1", "address": {"street": "123 Main St", "city": "Seattle", "state": "WA", "zip": "98101"}},
            {"success": True, "property_id": "2", "address": {"street": "123 Main Street", "city": "Seattle", "state": "WA", "zip": "98101"}},
            {"success": True, "property_id": "3", "address": {"street": "124 Main St", "city": "Seattle", "state": "WA", "zip": "98101"}},
            {"success": True, "property_id": "4", "address": {"street": "123 Main St.", "city": "Seattle", "state": "WA", "zip": "98101"}},
        ]
        # Each ETL run returns the next mock result
        MockZillowPropertyETL.return_value.run.side_effect = mock_results
        etl = ZillowPropertySearchETL(config={"api_key": "fake"})
        zpids = ["1", "2", "3", "4"]
        # Patch the fuzzy_deduplicate_records threshold for this test
        with patch('etl.data_validation.fuzzy_deduplicate_records') as mock_fuzzy:
            # Simulate threshold 98: only exact near-duplicates merged
            mock_fuzzy.side_effect = lambda recs, address_field, threshold=98: [recs[0], recs[2]]
            result = etl.load(zpids)
            self.assertEqual(len(result['properties']), 2)
            # Simulate threshold 95: more aggressive, merges all similar
            mock_fuzzy.side_effect = lambda recs, address_field, threshold=95: [recs[0]]
            result = etl.load(zpids)
            self.assertEqual(len(result['properties']), 1)

if __name__ == "__main__":
    unittest.main()
