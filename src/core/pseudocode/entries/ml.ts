import type { Pseudocode } from '../PseudocodeRegistry';

export const ML_PSEUDOCODE: Record<string, Pseudocode> = {
  'bayes-rule': {
    lines: [
      /* 0 */ 'procedure bayes(hypotheses, evidence)',
      /* 1 */ '  write each prior P(H)',
      /* 2 */ '  write each likelihood P(E | H)',
      /* 3 */ '  joint[H] <- P(H) * P(E | H)',
      /* 4 */ '  evidenceMass <- sum(joint)',
      /* 5 */ '  for each hypothesis H do',
      /* 6 */ '    posterior[H] <- joint[H] / evidenceMass',
    ],
  },
  'markov-chain': {
    lines: [
      /* 0 */ 'procedure markov(start, transition, steps)',
      /* 1 */ '  distribution[0] <- start',
      /* 2 */ '  for t <- 1 to steps do',
      /* 3 */ '    for each destination state j do',
      /* 4 */ '      sum distribution[t-1][i] * transition[i][j]',
      /* 5 */ '      distribution[t][j] <- sum',
      /* 6 */ '  highlight the most likely final state',
    ],
  },
  'k-means': {
    lines: [
      /* 0 */ 'procedure kMeans(points, k)',
      /* 1 */ '  initialise centroids',
      /* 2 */ '  assign each point to the nearest centroid',
      /* 3 */ '  record the cluster label',
      /* 4 */ '  for each centroid do',
      /* 5 */ '    move centroid to the mean of assigned points',
      /* 6 */ '  repeat until stable or iteration limit is reached',
    ],
  },
  'linear-regression-gd': {
    lines: [
      /* 0 */ 'procedure linearRegressionGD(points)',
      /* 1 */ '  initialise slope and bias',
      /* 2 */ '  update slope using dMSE/dSlope',
      /* 3 */ '  update bias using dMSE/dBias',
      /* 4 */ '  record mean squared error',
    ],
  },
  'logistic-regression': {
    lines: [
      /* 0 */ 'procedure logisticRegression(points)',
      /* 1 */ '  initialise weight and bias',
      /* 2 */ '  probability <- sigmoid(weight*x + bias)',
      /* 3 */ '  update weight and bias from log-loss gradient',
      /* 4 */ '  record log loss and accuracy',
    ],
  },
  'naive-bayes': {
    lines: [
      /* 0 */ 'procedure naiveBayes(features)',
      /* 1 */ '  start with class prior',
      /* 2 */ '  for each observed feature do',
      /* 3 */ '    multiply by feature likelihood',
      /* 4 */ '  classScore <- prior * likelihoods',
      /* 5 */ '  return class with highest score',
    ],
  },
  pca: {
    lines: [
      /* 0 */ 'procedure PCA(points)',
      /* 1 */ '  center each coordinate by subtracting the mean',
      /* 2 */ '  compute covariance matrix',
      /* 3 */ '  find dominant eigenvector',
      /* 4 */ '  project points onto the first principal component',
    ],
  },
  perceptron: {
    lines: [
      /* 0 */ 'procedure perceptron(samples)',
      /* 1 */ '  initialise weights',
      /* 2 */ '  predict sign(w*x + b)',
      /* 3 */ '  if prediction is wrong, update weights',
    ],
  },
  'nn-forward-pass': {
    lines: [
      /* 0 */ 'procedure forwardPass(network, input)',
      /* 1 */ '  write input activations',
      /* 2 */ '  compute weighted hidden sums',
      /* 3 */ '  apply activation function',
      /* 4 */ '  combine hidden activations',
      /* 5 */ '  apply output activation',
    ],
  },
  backpropagation: {
    lines: [
      /* 0 */ 'procedure backprop(example)',
      /* 1 */ '  run forward prediction',
      /* 2 */ '  compute loss',
      /* 3 */ '  compute output delta',
      /* 4 */ '  propagate delta backward to hidden weights',
      /* 5 */ '  update each weight by gradient descent',
    ],
  },
  'cnn-convolution': {
    lines: [
      /* 0 */ 'procedure convolution(image, kernel)',
      /* 1 */ '  slide kernel over image',
      /* 2 */ '  multiply overlapping values',
      /* 3 */ '  sum products into output feature map',
    ],
  },
  'self-attention': {
    lines: [
      /* 0 */ 'procedure selfAttention(tokens)',
      /* 1 */ '  build query, key and value vectors',
      /* 2 */ '  score each query against every key',
      /* 3 */ '  softmax scores into attention weights',
      /* 4 */ '  take weighted sum of values',
    ],
  },
  'q-learning': {
    lines: [
      /* 0 */ 'procedure qLearning(environment)',
      /* 1 */ '  observe state and choose action',
      /* 2 */ '  receive reward and next state',
      /* 3 */ '  Q[s,a] <- Q[s,a] + alpha * (reward + gamma*maxQ(next) - Q[s,a])',
    ],
  },
};
