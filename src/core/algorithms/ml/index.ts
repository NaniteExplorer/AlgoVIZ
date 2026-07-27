import { algorithmRegistry } from '../AlgorithmRegistry';
import { BayesRule } from './BayesRule';
import {
  LinearRegressionGradientDescent,
  LogisticRegression,
  NaiveBayesClassifier,
  PrincipalComponentAnalysis,
} from './ClassicML';
import {
  Backpropagation,
  CNNConvolution,
  NeuralNetworkForwardPass,
  PerceptronLearning,
  SelfAttention,
} from './DeepLearning';
import { KMeansClustering } from './KMeansClustering';
import { MarkovChain } from './MarkovChain';
import { QLearning } from './ReinforcementLearning';

export const ML_ALGORITHMS = [
  new BayesRule(),
  new MarkovChain(),
  new LinearRegressionGradientDescent(),
  new LogisticRegression(),
  new NaiveBayesClassifier(),
  new KMeansClustering(),
  new PrincipalComponentAnalysis(),
  new PerceptronLearning(),
  new NeuralNetworkForwardPass(),
  new Backpropagation(),
  new CNNConvolution(),
  new SelfAttention(),
  new QLearning(),
];

algorithmRegistry.registerAll(ML_ALGORITHMS);

export { MLAlgorithm, ML_CATEGORY } from './MLAlgorithm';
export { BayesRule } from './BayesRule';
export { MarkovChain } from './MarkovChain';
export { KMeansClustering } from './KMeansClustering';
export {
  LinearRegressionGradientDescent,
  LogisticRegression,
  NaiveBayesClassifier,
  PrincipalComponentAnalysis,
} from './ClassicML';
export {
  Backpropagation,
  CNNConvolution,
  NeuralNetworkForwardPass,
  PerceptronLearning,
  SelfAttention,
} from './DeepLearning';
export { QLearning } from './ReinforcementLearning';
