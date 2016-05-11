#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

#define DHTPIN 2
#define DHTTYPE DHT22   // DHT 22  (AM2302)
#define SOLARPIN A2
#define GROVEPIN A0
#define LED 13
#define VIEWDELAY 500  //0.5 second
#define NEXTDELAY 5000 //5 seconds

#define OLED_RESET 4
Adafruit_SSD1306 display(OLED_RESET);

float groveSensorValue;
float solarPanelValue;
float humidity;
float temperature;
float heatIndex;

char* title[]={"Soil moisture", "Temperature", "Humidity", "Heat Index", "Solar Energy"};

DHT dht(DHTPIN, DHTTYPE);

void setup()   {
  Serial.begin(9600);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  dht.begin();
} 

void loop() {
  senseAndShowGroveMoisture();
  view(0, groveSensorValue);
  readDHT();
  view(1, temperature);
  view(2, humidity);
  view(3, heatIndex);
  senseSolar();
  view(4, solarPanelValue);
}

void view(int t, float v) {
  digitalWrite(LED, HIGH);
  Serial.print(title[t]);
  Serial.print('=');
  Serial.println(v);
  delay(VIEWDELAY);
  digitalWrite(LED, LOW);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0,0);
  display.println(title[t]);
  display.setTextSize(3);
  display.print(v);
  display.display();
  delay(NEXTDELAY);
}

void senseAndShowGroveMoisture(void) {
  groveSensorValue = ((float)analogRead(GROVEPIN)/ 1023.0) * 100.0;
}

void senseSolar(void) {
  solarPanelValue = ((float)analogRead(SOLARPIN) / 1023.0) * 100.0;
}

void readDHT(void) {
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();
  heatIndex = dht.computeHeatIndex(temperature, humidity, false);
}

