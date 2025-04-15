
import { Theme } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const themes = {
  default: {
    primary: "#DC2626",
    background: "#FFFFFF",
    text: "#1A1A1A",
    accent: "#FEE2E2",
  },
  elegant: {
    primary: "#6B4E71",
    background: "#F8F5F9",
    text: "#2D232E",
    accent: "#D4BFD8",
  },
  natural: {
    primary: "#7D9D9C",
    background: "#F0F5F5",
    text: "#2C3333",
    accent: "#D1E3E3",
  },
  vintage: {
    primary: "#D4A373",
    background: "#FEFAE0",
    text: "#4A4238",
    accent: "#E9EDC9",
  },
  modern: {
    primary: "#845EC2",
    background: "#F5F3F9",
    text: "#2C2445",
    accent: "#D5CCE6",
  }
};

interface ThemeSelectorProps {
  value: Theme;
  onChange: (theme: Theme) => void;
}

export default function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="primary">Cor Principal</Label>
          <input
            type="color"
            id="primary"
            value={value.primary}
            onChange={(e) => onChange({ ...value, primary: e.target.value })}
            className="block w-full h-10 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="background">Cor de Fundo</Label>
          <input
            type="color"
            id="background"
            value={value.background}
            onChange={(e) => onChange({ ...value, background: e.target.value })}
            className="block w-full h-10 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="text">Cor do Texto</Label>
          <input
            type="color"
            id="text"
            value={value.text}
            onChange={(e) => onChange({ ...value, text: e.target.value })}
            className="block w-full h-10 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="accent">Cor de Destaque</Label>
          <input
            type="color"
            id="accent"
            value={value.accent}
            onChange={(e) => onChange({ ...value, accent: e.target.value })}
            className="block w-full h-10 mt-1"
          />
        </div>
      </div>

      <h3 className="font-medium mt-8 mb-4">Temas Pré-definidos</h3>
      <RadioGroup
        value={Object.entries(themes).find(
          ([_, theme]) => JSON.stringify(theme) === JSON.stringify(value)
        )?.[0] || "default"}
        onValueChange={(themeName) => onChange(themes[themeName as keyof typeof themes])}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(themes).map(([name, theme]) => (
            <div key={name}>
              <RadioGroupItem
                value={name}
                id={`theme-${name}`}
                className="sr-only"
              />
              <Label
                htmlFor={`theme-${name}`}
                className="cursor-pointer"
              >
                <Card
                  className={`p-4 hover:border-primary transition-colors ${
                    JSON.stringify(value) === JSON.stringify(theme)
                      ? "border-2 border-primary"
                      : ""
                  }`}
                >
                  <div className="space-y-2">
                    <div
                      className="w-full h-20 rounded-md"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <div className="space-y-1">
                      <h4 className="font-medium capitalize">{name}</h4>
                      <div className="flex gap-1">
                        {Object.values(theme).map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
