struct MainView: View {
    @State private var isMirroring = false
    @State private var deviceUrl = "http://<아이폰IP>:8080"

    var body: some View {
        VStack(spacing: 24) {
            Text("iTuss")
                .font(.largeTitle.bold())

            Text(deviceUrl)
                .font(.footnote)
                .foregroundColor(.gray)
                .padding(8)
                .background(Color.black.opacity(0.05))
                .cornerRadius(8)

            Button(isMirroring ? "Stop Mirroring" : "Start Mirroring") {
                // TODO: 나중에 ReplayKit 시작/종료 붙이기
                isMirroring.toggle()
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(isMirroring ? Color.red : Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
        }
        .padding()
    }
}
