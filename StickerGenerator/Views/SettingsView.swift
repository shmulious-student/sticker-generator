import SwiftUI

struct SettingsView: View {
    @Binding var activeProviderRaw: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Image Provider") {
                    Picker("Provider", selection: $activeProviderRaw) {
                        ForEach(ProviderID.allCases) { provider in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(provider.displayName)
                                Text(provider.blurb)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            .tag(provider.rawValue)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                Section {
                    Text("API keys are read from Config/Secrets.xcconfig at build time. "
                        + "Copy Secrets.example.xcconfig to Secrets.xcconfig and fill in your keys.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
