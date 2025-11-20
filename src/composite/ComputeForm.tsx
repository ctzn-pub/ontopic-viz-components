'use client'
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { DataSourceKey, Dictionary, FormData, DATA_SOURCES, VARIABLE_CATEGORIES } from '../types';
import { dictionary } from '../dictionary';

interface ComputeFormProps {
    dictionary: Dictionary;
    formData: FormData;
    formLoading: boolean;
    onSubmit: () => void;
    onVariableChange: (category: string, variable: string, checked: CheckedState) => void;
    onDataSourceChange: (value: DataSourceKey) => void;
    onDependentVarChange: (value: string) => void;
    onXVarChange: (value: string) => void;
    onInteractionAdd: (interactionLength: number) => void;
    onInteractionUpdate: (index: number, position: number, value: string) => void;
    onInteractionRemove: (index: number) => void;
    onYearCoefficientsChange: (checked: CheckedState) => void;
    onPoliticalEraCoefficientsChange: (checked: CheckedState) => void;
}

export const ComputeForm: React.FC<ComputeFormProps> = ({
    dictionary,
    formData,
    formLoading,
    onSubmit,
    onVariableChange,
    onDataSourceChange,
    onDependentVarChange,
    onXVarChange,
    onInteractionAdd,
    onInteractionUpdate,
    onInteractionRemove,
    onYearCoefficientsChange,
    onPoliticalEraCoefficientsChange
}) => {
    // Format variable name for display
    const getVariableDisplayName = (varName: string) => {
        return dictionary[varName]?.alias?.[0] || varName.replace(/([A-Z])/g, ' $1').trim();
    };

    const outcomeVars = Object.entries(dictionary)
        .filter(([key]) => dictionary[key]?.outcome_demo?.includes('outcome'))
        .map(([key]) => key)
        .sort((a, b) => getVariableDisplayName(a).localeCompare(getVariableDisplayName(b)));

    return (
        <Card>
            <CardContent className="space-y-4 mt-4">
                {/* Data Source Selection */}
                <div>
                    <Label>Data Source</Label>
                    <Select
                        value={formData.dataSource}
                        onValueChange={(value: DataSourceKey) => onDataSourceChange(value)}
                        disabled={formLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a data source" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(DATA_SOURCES).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                    {config.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Dependent Variable Selection */}
                <div>
                    <Label>Dependent Variable</Label>
                    <Select
                        value={formData.dependentVar}
                        onValueChange={onDependentVarChange}
                        disabled={formLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select dependent variable" />
                        </SelectTrigger>
                        <SelectContent>
                            {outcomeVars.map(varName => (
                                <SelectItem key={varName} value={varName}>
                                    {getVariableDisplayName(varName)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Independent Variables Selection */}
                <div className="space-y-2">
                    <Label>Variables</Label>
                    {Object.entries(VARIABLE_CATEGORIES[formData.dataSource]).map(([category, variables]) => (
                        category !== 'wellbeing' && (
                            <div key={category} className="mt-3">
                                <Label className="text-sm text-gray-500 capitalize">
                                    {category.replace(/([A-Z])/g, ' $1').trim()}
                                </Label>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                                    {variables.map(varName => (
                                        dictionary[varName] && (
                                            <div key={varName} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={varName}
                                                    checked={formData.selectedVars[category]?.[varName] || false}
                                                    onCheckedChange={(checked) => onVariableChange(category, varName, checked)}
                                                    disabled={formLoading}
                                                    className="size-3.5"
                                                />
                                                <label htmlFor={varName} className="text-sm leading-none">
                                                    {getVariableDisplayName(varName)}
                                                </label>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {/* X Variable Selection */}
                <div>
                    <Label>X Variable</Label>
                    <Select
                        value={formData.xVar}
                        onValueChange={onXVarChange}
                        disabled={formLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select X variable" />
                        </SelectTrigger>
                        <SelectContent>
                            {outcomeVars.map(varName => (
                                <SelectItem key={varName} value={varName}>
                                    {getVariableDisplayName(varName)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Advanced Options */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="advanced">
                        <AccordionTrigger>Advanced Options</AccordionTrigger>
                        <AccordionContent>
                            {/* Interactions */}
                            <div className="space-y-2 mb-4">
                                <Label>Interactions</Label>
                                {formData.interactions.map((interaction, index) => (
                                    <div key={index} className="flex space-x-2 items-center">
                                        {Array.from({ length: interaction.length }).map((_, position) => (
                                            <Select
                                                key={position}
                                                value={interaction[position] || "none"}
                                                onValueChange={(value) => onInteractionUpdate(index, position, value === "none" ? "" : value)}
                                                disabled={formLoading}
                                            >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder={`Select variable ${position + 1}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {Object.values(formData.selectedVars)
                                                        .flatMap(categoryVars =>
                                                            Object.entries(categoryVars)
                                                                .filter(([_, isSelected]) => isSelected)
                                                                .map(([varName]) => varName)
                                                        )
                                                        .map(varName => (
                                                            <SelectItem key={varName} value={varName}>
                                                                {getVariableDisplayName(varName)}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        ))}
                                        <button
                                            onClick={() => onInteractionRemove(index)}
                                            disabled={formLoading}
                                            className="text-gray-400 hover:text-gray-500 p-2"
                                            aria-label="Remove interaction"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <div className="flex space-x-2 mt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onInteractionAdd(2)}
                                        disabled={formLoading}
                                    >
                                        Add 2-Way Interaction
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onInteractionAdd(3)}
                                        disabled={formLoading}
                                    >
                                        Add 3-Way Interaction
                                    </Button>
                                </div>
                            </div>

                            {/* Additional Options */}
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="yearCoefficients"
                                        checked={!formData.showYearCoefficients}
                                        onCheckedChange={(checked) => onYearCoefficientsChange(!checked)}
                                        disabled={formLoading}
                                    />
                                    <label htmlFor="yearCoefficients">Do Not Show Year Coefficients</label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="politicalEraCoefficients"
                                        checked={!formData.showPoliticalEraCoefficients}
                                        onCheckedChange={(checked) => onPoliticalEraCoefficientsChange(!checked)}
                                        disabled={formLoading}
                                    />
                                    <label htmlFor="politicalEraCoefficients">Do Not Show Political Era Coefficients</label>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
};

export default ComputeForm;
