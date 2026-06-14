import SwiftUI

struct ContentView: View {
    @AppStorage("activeProvider") private var activeProviderRaw = ProviderID.gemini.rawValue
    @StateObject private var viewModel = GeneratorViewModel()
    @State private var showSettings = false

    private var activeProvider: ProviderID {
        ProviderID(rawValue: activeProviderRaw) ?? .gemini
    }

    var body: some View {
        NavigationStack {
            GeneratorView(viewModel: viewModel, activeProvider: activeProvider)
                .navigationTitle("Sticker Generator")
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showSettings = true
                        } label: {
                            Image(systemName: "gearshape")
                        }
                    }
                }
                .sheet(isPresented: $showSettings) {
                    SettingsView(activeProviderRaw: $activeProviderRaw)
                }
        }
    }
}

#Preview {
    ContentView()
}
