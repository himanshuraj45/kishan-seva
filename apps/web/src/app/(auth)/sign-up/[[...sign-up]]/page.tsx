import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <SignUp 
      appearance={{
        elements: {
          rootBox: "w-full max-w-md",
          card: "bg-[#0f172a]/60 border border-white/5 shadow-xl backdrop-blur-md rounded-2xl w-full",
          headerTitle: "hidden",
          headerSubtitle: "hidden",
          socialButtonsBlockButton: "bg-white/5 border border-white/10 text-white hover:bg-white/10",
          socialButtonsBlockButtonText: "font-semibold text-white",
          dividerLine: "bg-white/10",
          dividerText: "text-white/40",
          formFieldLabel: "text-white/70 font-medium",
          formFieldInput: "bg-white/5 border-white/10 text-white focus:border-[#10b981] focus:ring-[#10b981]/20",
          formButtonPrimary: "bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/20 font-bold py-2.5",
          footerActionText: "text-white/60",
          footerActionLink: "text-[#10b981] hover:text-[#059669] font-semibold",
          identityPreviewText: "text-white",
          identityPreviewEditButton: "text-[#10b981]",
          formFieldAction: "text-[#10b981]",
        }
      }}
    />
  );
}
