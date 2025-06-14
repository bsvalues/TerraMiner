import sys
from unittest.mock import patch, MagicMock

# Patch sys.modules for all problematic imports before anything else
mock_modules = {
    'etl.narrpr_scraper': MagicMock(),
    'selenium': MagicMock(),
    'app': MagicMock(),
    'etl.pacmls_etl.Property': MagicMock(),
    'etl.pacmls_etl.db': MagicMock(),
}
with patch.dict(sys.modules, mock_modules):
    import unittest
    from etl.pacmls_etl import PacMlsETL

    class TestPacMlsETLIntegration(unittest.TestCase):
        @patch('etl.pacmls_etl.Property')
        @patch('etl.pacmls_etl.db')
        def test_pacmls_etl_deduplication_thresholds(self, mock_db, mock_Property):
            # Patch Property.query.filter_by().first() to always return None (simulate new records)
            mock_Property.query.filter_by.return_value.first.return_value = None
            # Patch db.session.begin as context manager
            mock_db.session.begin.return_value.__enter__.return_value = None
            mock_db.session.begin.return_value.__exit__.return_value = None
            # Input records with near-duplicates
            properties = [
                {"id": "1", "address": {"street": "123 Main St", "city": "Seattle", "state": "WA", "zip": "98101"}},
                {"id": "2", "address": {"street": "123 Main Street", "city": "Seattle", "state": "WA", "zip": "98101"}},
                {"id": "3", "address": {"street": "124 Main St", "city": "Seattle", "state": "WA", "zip": "98101"}},
                {"id": "4", "address": {"street": "123 Main St.", "city": "Seattle", "state": "WA", "zip": "98101"}},
            ]
            transformed_data = {"properties": properties, "market_trends": []}
            etl = PacMlsETL()
            with patch('etl.data_validation.fuzzy_deduplicate_records') as mock_fuzzy:
                # Simulate threshold 96: only exact near-duplicates merged
                mock_fuzzy.side_effect = lambda recs, address_field, threshold=96: [recs[0], recs[2]]
                result = etl.load(transformed_data)
                self.assertEqual(result['properties_added'], 2)
                # Simulate threshold 93: more aggressive
                mock_fuzzy.side_effect = lambda recs, address_field, threshold=93: [recs[0]]
                result = etl.load(transformed_data)
                self.assertEqual(result['properties_added'], 1)

    if __name__ == "__main__":
        unittest.main()

class TestPacMlsETLIntegration(unittest.TestCase):
    @patch('etl.pacmls_etl.Property')
    @patch('etl.pacmls_etl.db')
    def test_pacmls_etl_deduplication_thresholds(self, mock_db, mock_Property):
        # Patch Property.query.filter_by().first() to always return None (simulate new records)
        mock_Property.query.filter_by.return_value.first.return_value = None
        # Patch db.session.begin as context manager
        mock_db.session.begin.return_value.__enter__.return_value = None
        mock_db.session.begin.return_value.__exit__.return_value = None
        # Input records with near-duplicates
        properties = [
            {"id": "1", "address": {"street": "123 Main St", "city": "Seattle", "state": "WA", "zip": "98101"}},
            {"id": "2", "address": {"street": "123 Main Street", "city": "Seattle", "state": "WA", "zip": "98101"}},
            {"id": "3", "address": {"street": "124 Main St", "city": "Seattle", "state": "WA", "zip": "98101"}},
            {"id": "4", "address": {"street": "123 Main St.", "city": "Seattle", "state": "WA", "zip": "98101"}},
        ]
        transformed_data = {"properties": properties, "market_trends": []}
        etl = PacMlsETL()
        with patch('etl.data_validation.fuzzy_deduplicate_records') as mock_fuzzy:
            # Simulate threshold 96: only exact near-duplicates merged
            mock_fuzzy.side_effect = lambda recs, address_field, threshold=96: [recs[0], recs[2]]
            result = etl.load(transformed_data)
            self.assertEqual(result['properties_added'], 2)
            # Simulate threshold 93: more aggressive
            mock_fuzzy.side_effect = lambda recs, address_field, threshold=93: [recs[0]]
            result = etl.load(transformed_data)
            self.assertEqual(result['properties_added'], 1)

if __name__ == "__main__":
    unittest.main()
