import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Load the dataset (make sure the CSV file is in the same directory or specify the full path)
data = pd.read_csv('diabetes_binary_5050split_health_indicators_BRFSS2015.csv')


# Strip any leading or trailing spaces in column names
data.columns = data.columns.str.strip()


# Create a synthetic target variable (kidney health state)
# Let's classify as "At Risk" if the person has diabetes, high blood pressure, or other risk factors
data['kidney_health_state'] = data.apply(lambda row: 'At Risk' if row['Diabetes_binary'] == 1 or row['HighBP'] == 1 else 'Healthy', axis=1)

# Features (X) - All columns except the target column
X = data.drop('kidney_health_state', axis=1)  # Features
y = data['kidney_health_state']  # Target variable (synthetic kidney health state)

# Split the data into training and test sets (70% training, 30% testing)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Initialize the Random Forest Classifier
model = RandomForestClassifier(random_state=42)

# Train the model
model.fit(X_train, y_train)

# Make predictions on the test set
y_pred = model.predict(X_test)

# Calculate accuracy
accuracy = accuracy_score(y_test, y_pred)
print("Random Forest Model Executing....")
print(f'Accuracy: {accuracy * 100:.2f}%')

# Generate a classification report (precision, recall, F1-score)
print("Classification Report:")
print(classification_report(y_test, y_pred))

# Save the trained model for future use (so you don't have to retrain it)
joblib.dump(model, 'kidney_health_predictor.pkl')
print("Model saved as 'kidney_health_predictor.pkl'")
