
# Design Document: Capital Gains Calculator

## 1. High-Level Design

### 1.1. Objective

The Capital Gains Calculator is a web tool designed to help users determine the capital gains tax implications of their stock trades from Robinhood and Fidelity. The tool will analyze trade history from CSV files and identify which stocks can be sold at the long-term capital gains rate.

### 1.2. Architecture

The application will follow a modular design, with distinct components for data ingestion, trade processing, and output generation. This will make the codebase easier to maintain and extend. The core of the application will be a Python script that can be executed from the command line.

### 1.3. Technology Stack

*   **Language:** Python 3.x
*   **Libraries:**
    *   `pandas`: For data manipulation and analysis, particularly for handling the trade data from CSV files.
    *   `argparse`: For creating the command-line interface.
    *   `requests`: For making HTTP requests to a financial data API (e.g., Alpha Vantage, Finnhub) to fetch real-time stock prices.

## 2. Core Functionality

### 2.1. Data Ingestion

The application will ingest trade data from CSV files provided by Robinhood and Fidelity.

*   **CSV Parsing:** The tool will be able to parse the specific CSV formats of both Robinhood and Fidelity.
*   **Unified Data Model:** The data from both sources will be transformed into a unified data model with the following fields:
    *   `ticker`: The stock ticker symbol.
    *   `purchase_date`: The date the stock was purchased.
    *   `quantity`: The number of shares purchased.
    *   `purchase_price`: The price per share at the time of purchase.

### 2.2. Trade Processing

The application will use the First-In, First-Out (FIFO) accounting method to process trades.

*   **FIFO Logic:** For each stock, the earliest purchased shares will be considered the first ones to be sold.
*   **Holding Period Calculation:** The holding period for each lot of shares will be calculated as the time between the `purchase_date` and the current date.

### 2.3. Capital Gains Calculation

The application will classify potential sales as either short-term or long-term.

*   **Short-Term:** A sale is considered short-term if the holding period is one year or less.
*   **Long-Term:** A sale is considered long-term if the holding period is more than one year.

### 2.4. Output

The application will generate a summary report that shows the number of shares of each stock that can be sold at the long-term capital gains rate.

*   **Output Format:** The output will be a table with the following columns:
    *   `Stock`: The stock ticker symbol.
    *   `Long-Term Sellable Units`: The number of shares that have been held for more than one year.

## 3. Web Application Design

The application will be a web-based interface with the following components:

*   **File Upload:** A component that allows users to upload their trade history in CSV format from Robinhood and Fidelity.
*   **Results Display:** A section that displays the results of the capital gains calculation in a clean and easy-to-read format.

### 3.1. Sell Planning

For any given stock, the user can input the number of shares they wish to sell. The application will then use the FIFO (First-In, First-Out) method to determine which of those shares are long-term and which are short-term. The hypothetical selling price will be fetched from a reliable, real-time pricing API, but the user will have the option to override it with a custom price. The application will then calculate the estimated capital gains tax for both the long-term and short-term portions of the sale.

## 4. Data Structures

The primary data structure will be a pandas DataFrame. This DataFrame will store the unified trade data from both Robinhood and Fidelity, and will be used for all subsequent processing and calculations.

## 5. Error Handling

The application will include error handling for the following scenarios:

*   **Invalid File Path:** If the user provides an invalid path to a CSV file, the application will print an error message and exit gracefully.
*   **Malformed CSV File:** If a CSV file is not in the expected format, the application will print an error message and attempt to continue processing other files if possible.
