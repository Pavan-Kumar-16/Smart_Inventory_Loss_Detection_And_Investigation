import mysql.connector

from config.db_config import DB_CONFIG


def test_connection():
    connection = None

    try:
        connection = mysql.connector.connect(**DB_CONFIG)

        if connection.is_connected():
            print("MySQL connection successful!")
            print(
                "Connected database:",
                connection.database
            )

    except mysql.connector.Error as error:
        print("MySQL connection failed:", error)

    finally:
        if connection and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    test_connection()