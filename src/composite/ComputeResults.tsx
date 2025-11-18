'use client'
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ForestPlot from '@/components/forest-plot';
import MainEffectsPlot from '@/components/main-effects-plot';
import InteractionEffectsPlot from '@/components/interaction-effects-plot';
import { AnalysisResults, TabValue, Dictionary } from '../types';
import { VariableHeader } from './VariableHeader';
import CopyResultsButton from './CopyResultsButton';

interface ComputeResultsProps {
    results: AnalysisResults | null;
    activeTab: string;
    onTabChange: (value: string) => void;
    dictionary?: Dictionary;
    dependentVar?: string;
}

export const ComputeResults: React.FC<ComputeResultsProps> = ({
    results,
    activeTab,
    onTabChange,
    dictionary,
    dependentVar
}) => {
    if (!results) return null;



    const alias = dictionary?.[dependentVar ?? '']?.alias;

    return (
        <Card>
            <CardContent className="pt-6">
                {dictionary && dependentVar && (
                    <div className="flex justify-between items-start mb-6 border-b pb-4">
                        <div>
                            <VariableHeader 
                                title={alias}
                                alias={[dependentVar]}
                            />
                        </div>
                        <CopyResultsButton 
                            results={results}
                            title={alias?.[0]}
                            subtitle={dependentVar}
                        />
                    </div>
                )}
                <Tabs defaultValue="modelResults" value={activeTab} onValueChange={onTabChange}>
                    <TabsList className="flex w-full">
                        <TabsTrigger value="modelResults" className="flex-1 font-medium">Model Results</TabsTrigger>
                        {results.marginal_effects_data && (
                            <TabsTrigger value="marginalEffects" className="flex-1">Marginal Effects</TabsTrigger>
                        )}
                        <TabsTrigger value="prediction" className="flex-1">Prediction</TabsTrigger>
                        {results.odds_ratios && (
                            <TabsTrigger value="oddsRatio" className="flex-1">Odds Ratios</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="modelResults" className="space-y-4">
                        <div className="prose">
                            <div className="table-container">
                                <h2>Model Fit</h2>
                                <table className="model-fit">
                                    <thead>
                                        <tr>
                                            <th>Observations</th>
                                            {results.odds_ratios ? (
                                                <>
                                                    <th>Log Likelihood</th>
                                                    <th>Pseudo R<sup>2</sup></th>
                                                </>
                                            ) : (
                                                <>
                                                    <th>R²</th>
                                                    <th>Adjusted R²</th>
                                                </>
                                            )}
                                            <th>AIC</th>
                                            <th>BIC</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>{results.model_fit?.observations}</td>
                                            {results.odds_ratios ? (
                                                <>
                                                    <td>{Number(results.model_fit?.log_likelihood || 0).toFixed(1)}</td>
                                                    <td>{Number(results.model_fit?.pseudo_r_squared || 0).toFixed(4)}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>{Number(results.model_fit?.rsquared || 0).toFixed(4)}</td>
                                                    <td>{Number(results.model_fit?.rsquared_adj || 0).toFixed(4)}</td>
                                                </>
                                            )}
                                            <td>{Number(results.model_fit?.aic || 0).toFixed(1)}</td>
                                            <td>{Number(results.model_fit?.bic || 0).toFixed(1)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {results.odds_ratios ? (
                                    <>
                                        <h2>Likelihood Ratio Test: Testing global null hypothesis β=0</h2>
                                        <table className="likelihood-ratio">
                                            <thead>
                                                <tr>
                                                    <th>χ<sup>2</sup> Test</th>
                                                    <th>DF</th>
                                                    <th>P {'>'} χ<sup>2</sup></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>{Number(results.likelihood_ratio_test?.chi_squared_test || 0).toFixed(3)}</td>
                                                    <td>{results.likelihood_ratio_test?.df}</td>
                                                    <td>{results.likelihood_ratio_test?.pr_chi_squared}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </>
                                ) : results.f_test && (
                                    <>
                                        <h2>F-test: Testing global null hypothesis β=0</h2>
                                        <table className="f-test">
                                            <thead>
                                                <tr>
                                                    <th>F-statistic</th>
                                                    <th>DF</th>
                                                    <th>Pr {'>'} F</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td>{Number(results.f_test?.f_statistic || 0).toFixed(3)}</td>
                                                    <td>{results.f_test?.df}</td>
                                                    <td>{Number(results.f_test?.p_value || 0).toFixed(3)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </>
                                )}
                                <h2>Parameter Estimates</h2>
                                <table className="parameter-estimates">
                                    <thead>
                                        <tr>
                                            <th>Term</th>
                                            <th>Coefficient</th>
                                            <th>Standard Error</th>
                                            <th>{results.odds_ratios ? 'z' : 't-stat'}</th>
                                            <th>Pr {results.odds_ratios ? '>|z|' : '>|t|'}</th>
                                            <th>95% Confidence Interval</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.coefficient_table.map((row, index) => {
                                            if ('label' in row) {
                                                return (
                                                    <tr key={index} data-category-header="true">
                                                        <td colSpan={6}>{row.label}</td>
                                                    </tr>
                                                );
                                            }
                                            
                                            if ('term' in row) {
                                                const coefficient = isNaN(Number(row.coefficient)) ? 'NaN' : Number(row.coefficient).toFixed(4);
                                                const stdError = isNaN(Number(row.std_error)) ? 'NaN' : Number(row.std_error).toFixed(4);
                                                const zValue = isNaN(Number(row.z_value)) ? 'NaN' : Number(row.z_value).toFixed(2);
                                                const pValue = isNaN(Number(row.p_value)) ? 'NaN' : Number(row.p_value).toFixed(3);
                                                
                                                // Check if ci_interval is a string that can be split
                                                let ci = '[NaN, NaN]';
                                                if (row.ci_interval) {
                                                    const [lower, upper] = row.ci_interval.replace(/[\[\]]/g, '').split(',').map(Number);
                                                    if (!isNaN(lower) && !isNaN(upper)) {
                                                        ci = `[${lower.toFixed(4)}, ${upper.toFixed(4)}]`;
                                                    }
                                                }
                                                
                                                return (
                                                    <tr key={index}>
                                                        <td>{row.term}</td>
                                                        <td>{coefficient}</td>
                                                        <td>{stdError}</td>
                                                        <td>{zValue}</td>
                                                        <td>{pValue}</td>
                                                        <td>{ci}</td>
                                                    </tr>
                                                );
                                            }
                                            
                                            return null;
                                        })}
                                    </tbody>
                                </table>

                                {results.footnote && (
                                    <div className="footnote">* {results.footnote}</div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {results.marginal_effects_data && (
                        <TabsContent value="marginalEffects">
                            <div>
                                <ForestPlot 
                                    data={results.marginal_effects_data.map(item => {
                                        // For base category labels, keep them but with null values
                                        if (item.Label.includes("Base =")) {
                                            return {
                                                term: item.Label,
                                                odds_ratio: "",
                                                conf_low: "",
                                                conf_high: ""
                                            };
                                        }
                                        // For actual data points
                                        return {
                                            term: item.Label,
                                            odds_ratio: item.MarginalEffect ? Number(item.MarginalEffect) : "",
                                            conf_low: item.LowerCI ? Number(item.LowerCI) : "",
                                            conf_high: item.UpperCI ? Number(item.UpperCI) : ""
                                        };
                                    })}
                                    title="Marginal Effects"
                                    subtitle="Estimated marginal effects with 95% confidence intervals"
                                    size="large"
                                />
                            </div>
                        </TabsContent>
                    )}

                    <TabsContent value="prediction">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Main Effects</h3>
                            <MainEffectsPlot 
                                data={{ main_effects: results.predictions.main_effects }} 
                                displayAsPercentage={!!(results.marginal_effects_data && results.odds_ratios?.length > 0)}
                            />

                            {Object.keys(results.predictions.interactions).length > 0 && (
                                <>
                                    <h3 className="text-lg font-semibold mb-4 mt-8 text-gray-900 dark:text-gray-100">Interaction Effects</h3>
                                    {Object.entries(results.predictions.interactions).map(([variables, data]) => (
                                        <div key={variables} className="mb-8">
                                            <h4 className="text-md font-medium mb-2 text-gray-900 dark:text-gray-100">{variables}</h4>
                                            <InteractionEffectsPlot 
                                                data={data} 
                                                variables={variables} 
                                                displayAsPercentage={!!(results.marginal_effects_data && results.odds_ratios?.length > 0)}
                                            />
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </TabsContent>

                    {results.odds_ratios && (
                        <TabsContent value="oddsRatio">
                            <div>
                                <ForestPlot 
                                    width={800}
                                    data={results.odds_ratios} 
                                    referenceLine={1}
                                />
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default ComputeResults;
