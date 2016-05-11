#define LED 13

void setup() {
	Serial.begin(9600);
}

void loop() {
	if (Serial.available()) {
		if(Serial.read() > 1) {
			digitalWrite(LED, HIGH);
		} else {
			digitalWrite(LED, LOW);
		}
	}
	delay(500);
}