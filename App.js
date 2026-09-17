import React, { useState, useEffect } from "react";
import { StyleSheet, View, TouchableWithoutFeedback, Text } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Dimensions, Animated } from "react-native";

const { width, height } = Dimensions.get("window");

const generateRandomPosition = () => ({
  x: Math.random() * (width - 20) + 10,
  y: Math.random() * (height - 20) + 10,
});

const calculateAvoidanceVector = (current, target, others) => {
  let dx = target.x - current.x;
  let dy = target.y - current.y;
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  dx = dx / magnitude;
  dy = dy / magnitude;

  others.forEach((other) => {
    const distance = Math.sqrt(
      (current.x - other.x) ** 2 + (current.y - other.y) ** 2
    );

    if (distance < 50) {
      const avoidFactor = (50 - distance) / 50;
      dx += (current.x - other.x) * avoidFactor * 0.1;
      dy += (current.y - other.y) * avoidFactor * 0.1;
    }
  });

  const adjustedMagnitude = Math.sqrt(dx * dx + dy * dy);
  dx = dx / adjustedMagnitude;
  dy = dy / adjustedMagnitude;

  return { x: dx, y: dy };
};

export default function App() {
  const [sparkPosition, setSparkPosition] = useState({ x: width / 2, y: height / 2 });
  const [direction, setDirection] = useState({ x: 0, y: -1 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [foodPosition, setFoodPosition] = useState(generateRandomPosition());
  const [enemies, setEnemies] = useState([generateRandomPosition(), generateRandomPosition()]);
  const [speedBoost, setSpeedBoost] = useState(generateRandomPosition());

  const sparkAnim = new Animated.Value(0);
  const enemyAnims = enemies.map(() => new Animated.Value(0));

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setSparkPosition((prev) => {
        const newX = prev.x + direction.x * 5;
        const newY = prev.y + direction.y * 5;

        if (newX < 0 || newX > width || newY < 0 || newY > height) {
          setGameOver(true);
          return prev;
        }

        if (Math.abs(newX - foodPosition.x) < 15 && Math.abs(newY - foodPosition.y) < 15) {
          setScore((prev) => prev + 10);
          setFoodPosition(generateRandomPosition());
        }

        if (Math.abs(newX - speedBoost.x) < 15 && Math.abs(newY - speedBoost.y) < 15) {
          setSpeedBoost(generateRandomPosition());
          // Apply speed boost effect (double speed for 5 seconds)
          setDirection((prev) => ({ x: prev.x * 2, y: prev.y * 2 }));
          setTimeout(() => setDirection((prev) => ({ x: prev.x / 2, y: prev.y / 2 })), 5000);
        }

        for (const enemy of enemies) {
          if (Math.abs(newX - enemy.x) < 15 && Math.abs(newY - enemy.y) < 15) {
            setGameOver(true);
            return prev;
          }
        }

        return { x: newX, y: newY };
      });

      setEnemies((prevEnemies) =>
        prevEnemies.map((enemy, index) => {
          const others = prevEnemies.filter((_, i) => i !== index);
          const avoidanceVector = calculateAvoidanceVector(enemy, sparkPosition, others);
          return {
            x: enemy.x + avoidanceVector.x * 4,
            y: enemy.y + avoidanceVector.y * 4,
          };
        })
      );
    }, 16);

    return () => clearInterval(interval);
  }, [direction, gameOver, foodPosition, enemies, sparkPosition, speedBoost]);

  const handleTap = () => {
    setDirection((prev) => ({ x: -prev.y, y: prev.x })); 
    setScore((prev) => prev + 1);
  };

  const resetGame = () => {
    setSparkPosition({ x: width / 2, y: height / 2 });
    setDirection({ x: 0, y: -1 });
    setScore(0);
    setFoodPosition(generateRandomPosition());
    setEnemies([generateRandomPosition(), generateRandomPosition()]);
    setGameOver(false);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <TouchableWithoutFeedback
        onPress={gameOver ? resetGame : handleTap}
      >
        <View style={styles.container}>
          <Svg height={height} width={width}>
            <Rect width={width} height={height} fill={"#121212"} />
            <Circle cx={sparkPosition.x} cy={sparkPosition.y} r={10} fill={"#FFD700"} />
            <Circle cx={foodPosition.x} cy={foodPosition.y} r={10} fill={"#00FF00"} />
            <Circle cx={speedBoost.x} cy={speedBoost.y} r={10} fill={"#0000FF"} />
            {enemies.map((enemy, index) => (
              <Circle key={index} cx={enemy.x} cy={enemy.y} r={10} fill={"#FF0000"} />
            ))}
          </Svg>
          {gameOver && (
            <View style={styles.gameOverOverlay}>
              <Text style={styles.gameOverText}>Game Over</Text>
              <Text style={styles.scoreText}>Score: {score}</Text>
              <Text style={styles.restartText}>Tap to Restart</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gameOverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  gameOverText: {
    fontSize: 36,
    color: "#FFD700",
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 24,
    color: "#FFF",
  },
  restartText: {
    fontSize: 16,
    color: "#AAA",
    marginTop: 10,
  },
});
