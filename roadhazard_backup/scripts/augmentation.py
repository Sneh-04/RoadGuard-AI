import numpy as np

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

def add_gaussian_noise(X, std=0.02):
    noise = np.random.normal(loc=0.0, scale=std, size=X.shape)
    return X + noise


def random_scaling(X, scale_range=(0.9, 1.1)):
    factor = np.random.uniform(scale_range[0], scale_range[1])
    return X * factor


def time_shift(X, shift_max=10):
    # shift along time axis, pad with zeros
    # X shape: (timesteps, channels)
    n = X.shape[0]
    shift = np.random.randint(-shift_max, shift_max)
    if shift > 0:
        # pad at beginning
        padded = np.pad(X, ((shift, 0), (0, 0)), mode='constant')
        shifted = padded[:n, :]
    elif shift < 0:
        # pad at end
        padded = np.pad(X, ((0, -shift), (0, 0)), mode='constant')
        shifted = padded[-n:, :]
    else:
        shifted = X
    return shifted


def jitter(X, sigma=0.01):
    return X + np.random.normal(loc=0.0, scale=sigma, size=X.shape)


def augment_batch(X):
    # apply random augmentation per sample
    X_aug = X.copy()
    for i in range(X.shape[0]):
        choice = np.random.choice(['noise', 'scale', 'shift', 'jitter'])
        if choice == 'noise':
            X_aug[i] = add_gaussian_noise(X_aug[i])
        elif choice == 'scale':
            X_aug[i] = random_scaling(X_aug[i])
        elif choice == 'shift':
            X_aug[i] = time_shift(X_aug[i])
        elif choice == 'jitter':
            X_aug[i] = jitter(X_aug[i])
    return X_aug
