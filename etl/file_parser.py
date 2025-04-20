import os
import logging
import pandas as pd
import csv
import json
from datetime import datetime

# Configure logger
logger = logging.getLogger(__name__)

class FileParser:
    """
    Utility class to handle ETL operations for file conversions and data transformation.
    """
    
    @staticmethod
    def csv_to_json(csv_file, json_file=None):
        """
        Convert CSV file to JSON format.
        
        Args:
            csv_file (str): Path to the CSV file
            json_file (str, optional): Path to save the JSON file. If None, a default path is generated.
            
        Returns:
            dict: The data as a Python dictionary
        """
        try:
            # Read CSV file
            if not os.path.exists(csv_file):
                logger.error(f"CSV file not found: {csv_file}")
                return None
            
            df = pd.read_csv(csv_file)
            
            # Create output directory if it doesn't exist
            output_dir = "output"
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            # Generate JSON filename if not provided
            if json_file is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                base_name = os.path.splitext(os.path.basename(csv_file))[0]
                json_file = os.path.join(output_dir, f"{base_name}_{timestamp}.json")
            
            # Convert to JSON
            json_data = df.to_dict(orient="records")
            
            # Save to file
            with open(json_file, 'w') as f:
                json.dump(json_data, f, indent=4)
            
            logger.info(f"CSV converted to JSON and saved as {json_file}")
            return json_data
            
        except Exception as e:
            logger.error(f"Error converting CSV to JSON: {str(e)}")
            return None
    
    @staticmethod
    def transform_property_data(input_file, output_file=None, transform_function=None):
        """
        Transform property data using a custom transformation function.
        
        Args:
            input_file (str): Path to the input file (CSV or JSON)
            output_file (str, optional): Path to save the transformed data
            transform_function (callable, optional): Custom function to transform each record
            
        Returns:
            list: The transformed data as a list of dictionaries
        """
        try:
            file_ext = os.path.splitext(input_file)[1].lower()
            
            # Read input file
            if file_ext == '.csv':
                df = pd.read_csv(input_file)
                data = df.to_dict(orient="records")
            elif file_ext == '.json':
                with open(input_file, 'r') as f:
                    data = json.load(f)
            else:
                logger.error(f"Unsupported file format: {file_ext}")
                return None
            
            # Apply transformation
            if transform_function and callable(transform_function):
                transformed_data = [transform_function(record) for record in data]
            else:
                # Default transformation - standardize field names
                transformed_data = []
                for record in data:
                    transformed_record = {}
                    for key, value in record.items():
                        # Standardize keys - convert to lowercase and replace spaces with underscores
                        new_key = key.lower().replace(' ', '_')
                        transformed_record[new_key] = value
                    transformed_data.append(transformed_record)
            
            # Generate output filename if not provided
            if output_file is None:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                base_name = os.path.splitext(os.path.basename(input_file))[0]
                output_file = os.path.join("output", f"{base_name}_transformed_{timestamp}.csv")
            
            # Save to file
            output_ext = os.path.splitext(output_file)[1].lower()
            if output_ext == '.csv':
                pd.DataFrame(transformed_data).to_csv(output_file, index=False)
            elif output_ext == '.json':
                with open(output_file, 'w') as f:
                    json.dump(transformed_data, f, indent=4)
            else:
                logger.error(f"Unsupported output format: {output_ext}")
                return transformed_data
            
            logger.info(f"Data transformed and saved as {output_file}")
            return transformed_data
            
        except Exception as e:
            logger.error(f"Error transforming data: {str(e)}")
            return None
    
    @staticmethod
    def merge_files(file_list, output_file, merge_on=None):
        """
        Merge multiple CSV or JSON files into a single file.
        
        Args:
            file_list (list): List of file paths to merge
            output_file (str): Path to save the merged file
            merge_on (str, optional): Column name to merge on (for CSV files)
            
        Returns:
            pandas.DataFrame: The merged data
        """
        try:
            if not file_list:
                logger.error("No files provided for merging")
                return None
            
            dataframes = []
            
            # Read all files
            for file_path in file_list:
                if not os.path.exists(file_path):
                    logger.warning(f"File not found: {file_path}")
                    continue
                
                file_ext = os.path.splitext(file_path)[1].lower()
                
                if file_ext == '.csv':
                    df = pd.read_csv(file_path)
                elif file_ext == '.json':
                    df = pd.read_json(file_path)
                else:
                    logger.warning(f"Unsupported file format: {file_ext}")
                    continue
                
                dataframes.append(df)
            
            if not dataframes:
                logger.error("No valid files to merge")
                return None
            
            # Merge dataframes
            if merge_on and all(merge_on in df.columns for df in dataframes):
                # Merge on specific column
                merged_df = dataframes[0]
                for df in dataframes[1:]:
                    merged_df = pd.merge(merged_df, df, on=merge_on, how='outer')
            else:
                # Concatenate
                merged_df = pd.concat(dataframes, ignore_index=True)
            
            # Create output directory if it doesn't exist
            output_dir = os.path.dirname(output_file)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            # Save merged data
            file_ext = os.path.splitext(output_file)[1].lower()
            if file_ext == '.csv':
                merged_df.to_csv(output_file, index=False)
            elif file_ext == '.json':
                merged_df.to_json(output_file, orient="records", indent=4)
            else:
                logger.warning(f"Unsupported output format: {file_ext}")
                output_file = os.path.splitext(output_file)[0] + '.csv'
                merged_df.to_csv(output_file, index=False)
            
            logger.info(f"Files merged and saved as {output_file}")
            return merged_df
            
        except Exception as e:
            logger.error(f"Error merging files: {str(e)}")
            return None
