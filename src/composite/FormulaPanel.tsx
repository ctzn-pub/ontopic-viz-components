import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormData } from "../types";
import { useDictionary } from "../context/DictionaryContext";

interface FormulaPanelProps {
    formData: FormData;
    onRunAnalysis: () => void;
    isLoading: boolean;
}

export function FormulaPanel({ formData, onRunAnalysis, isLoading }: FormulaPanelProps) {
    const dictionary = useDictionary();

    // Format variable name for display
    const getVariableDisplayName = (varName: string) => {
        return dictionary[varName]?.alias?.[0] || varName;
    };

    // Get all selected variables in order
    const selectedVars = formData.selectedVarsOrder.filter(varName => 
        Object.values(formData.selectedVars)
            .some(categoryVars => categoryVars[varName])
    );

    // Format variable name for display
    const formatVar = (varName: string) => {
        return getVariableDisplayName(varName);
    };

    // Build the formula string
    const depVar = formatVar(formData.dependentVar);
    const xVar = formData.xVar ? formatVar(formData.xVar) : '';
    const otherVars = selectedVars
        .filter(v => v !== formData.xVar)  // Exclude xVar from main variables
        .map(formatVar)
        .join(' + ');
    
    // Format interactions
    const interactions = formData.interactions
        .map(interaction => {
            const filled = interaction.filter(v => v !== "");
            if (filled.length >= 2) {
                return filled.map(formatVar).join(' × ');
            }
            return null;
        })
        .filter((term): term is string => term !== null);

    const interactionTerms = interactions.length > 0 
        ? ' + ' + interactions.join(' + ')
        : '';

    return (
        <Card className="p-4 mb-4 bg-white dark:bg-gray-800">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="grow font-serif italic text-lg break-words text-gray-900 dark:text-gray-100">
                    <span className="inline-flex flex-wrap gap-x-1">
                        <span>{depVar} = β₀ +</span>
                        {xVar && <span>β₁{xVar} +</span>}
                        {otherVars.split(' + ').map((term, i) => (
                            <span key={i}>β{i + 2}{term}{i < otherVars.split(' + ').length - 1 ? ' +' : ''}</span>
                        ))}
                        {interactions.map((term, i) => (
                            <span key={`int-${i}`}>+ β{i + otherVars.split(' + ').length + 2}({term})</span>
                        ))}
                        <span>+ ε</span>
                    </span>
                </div>
                <Button 
                    onClick={onRunAnalysis}
                    disabled={isLoading}
                    className="whitespace-nowrap"
                >
                    Run Analysis
                </Button>
            </div>
        </Card>
    );
}
