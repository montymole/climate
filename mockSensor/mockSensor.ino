#define LED 13

String inputString = "";
float testValue = 0.0;

void setup() {
	Serial.begin(9600);
	inputString.reserve(200);
}

void loop() {
	//data coming out
	testValue = testValue + 0.1;
	Serial.print("Testdata=");
	Serial.println(testValue);
	delay(5000);

}

void serialEvent() {
  while (Serial.available()) {
    // get the new byte:
    char inChar = (char)Serial.read();
    // add it to the inputString:
    inputString += inChar;
    // if the incoming character is a newline, set a flag
    // so the main loop can do something about it:
    if (inChar == '\n') {
		Serial.print("Recieved=");
    	Serial.println(inputString);
    	// clear the string:
    	inputString = "";
    }
  }
}

