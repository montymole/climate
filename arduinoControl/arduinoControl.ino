#include <Wire.h>
#include <Adafruit_RGBLCDShield.h>
#include <utility/Adafruit_MCP23017.h>
#include <string.h>

#define PS_ON 2
#define R1 4
#define R2 5
#define R3 6  
#define R4 7
#define LED 13

#define CMD_PSU_ON  2
#define CMD_PSU_OFF 3
#define CMD_LED_ON  4
#define CMD_LED_OFF 5
#define CMD_R1_ON   6
#define CMD_R1_OFF  7
#define CMD_R2_ON   8
#define CMD_R2_OFF  9
#define CMD_R3_ON   10
#define CMD_R3_OFF  11
#define CMD_R4_ON   12
#define CMD_R4_OFF  13

#define BLACK 0x0
#define RED 0x1
#define YELLOW 0x3
#define GREEN 0x2
#define TEAL 0x6
#define BLUE 0x4
#define VIOLET 0x5
#define WHITE 0x7

byte heart1Char[8] = {
  0x0,0xa,0x15,0x11,0xa,0x4,0x0,0x0
};

byte heart2Char[8] = {
  0x0,0xa,0x1f,0x1f,0xe,0x4,0x0,0x0
};

byte clockChar[8] = {
  0x0,0xe,0x15,0x17,0x11,0xe,0x0,0x0
};

byte happyChar[8] = {
  0x0,0x0,0xa,0x0,0x11,0xe,0x0,0x0
};

byte sadChar[8] = {
  0x0,0x0,0xa,0x0,0xe,0x11,0x0,0x0
};

Adafruit_RGBLCDShield lcd = Adafruit_RGBLCDShield();

void setup() {
  //init serial
  Serial.begin(9600);
  // set up the LCD's number of columns and rows:
  lcd.begin(16, 2);
  lcd.setBacklight(WHITE);
  lcd.createChar(0,heart1Char);
  lcd.createChar(1,heart2Char);
  lcd.createChar(2,clockChar);
  lcd.createChar(3,happyChar);
  lcd.createChar(4,sadChar);

  lcd.setCursor(0,0);
  lcd.write(0);
  lcd.setCursor(1,0);
  lcd.print("READY");

  //PS_ON control pin
  pinMode(PS_ON, OUTPUT);
  // initialize relay controls
  pinMode(R1, OUTPUT);
  pinMode(R2, OUTPUT);
  pinMode(R3, OUTPUT);
  pinMode(R4, OUTPUT);
}

// the loop function runs over and over again forever
void loop() {
}

void serialEvent() {
  while (Serial.available()) {
    int cmd = Serial.parseInt();
    lcd.setCursor(0,0);
    lcd.write(1);
    lcd.setCursor(1,0);
    if (Serial.read() == '\n') {
      switch(cmd) {
        case CMD_PSU_ON:
          digitalWrite(PS_ON, LOW);
          //---------**********
          lcd.print("PSU ON    ");
          Serial.println("PSU=1");
          break;
        case CMD_PSU_OFF:
          digitalWrite(PS_ON, HIGH);
          //---------**********
          lcd.print("PSU OFF   ");
          Serial.println("PSU=0");
          break;
        case CMD_LED_ON:
          digitalWrite(LED, HIGH);
           //---------**********
          lcd.print("LED ON     ");
          Serial.println("LED=1");
          break;
        case CMD_LED_OFF:
          digitalWrite(LED, LOW);
           //---------**********
          lcd.print("LED OFF    ");
          Serial.println("LED=0");
          break;
        case CMD_R1_ON:
          digitalWrite(R1, HIGH);
           //---------**********
          lcd.print("RELAY1 ON  ");
          Serial.println("RELAY1=1");
          break;
        case CMD_R1_OFF:
          digitalWrite(R1, LOW);
           //---------**********
          lcd.print("RELAY1 OFF ");
          Serial.println("RELAY1=0");
          break;
        case CMD_R2_ON:
          digitalWrite(R2, HIGH);
           //---------**********
          lcd.print("RELAY2 ON  ");
          Serial.println("RELAY2=1");
          break;
        case CMD_R2_OFF:
          digitalWrite(R2, LOW);
           //---------**********
          lcd.print("RELAY2 OFF ");
          Serial.println("RELAY2=0");
          break;
         case CMD_R3_ON:
          digitalWrite(R3, HIGH);
           //---------**********
          lcd.print("RELAY3 ON  ");
          Serial.println("RELAY3=1");
          break;
        case CMD_R3_OFF:
          digitalWrite(R3, LOW);
           //---------**********
          lcd.print("RELAY3 OFF ");
          Serial.println("RELAY3=0");
          break;
        case CMD_R4_ON:
          digitalWrite(R4, HIGH);
           //---------**********
          lcd.print("RELAY4 ON  ");
          Serial.println("RELAY4=1");
          break;
        case CMD_R4_OFF:
          digitalWrite(R4, LOW);
           //---------**********
          lcd.print("RELAY4 OFF ");
          Serial.println("RELAY4=0");
          break;
        default:
          //---------**********
          lcd.print("UNKNOWN   ");
          break;
      }
      delay(500);
      lcd.setCursor(0,0);
      lcd.write(0);
    }
  }
}

