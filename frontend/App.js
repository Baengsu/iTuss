import { View, Text, Button } from "react-native";

export default function App() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f2f2f2",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>
        ✅ 화면 연결 성공!
      </Text>
      <Button title="눌러보기" onPress={() => alert("잘 뜹니다!")} />
    </View>
  );
}
