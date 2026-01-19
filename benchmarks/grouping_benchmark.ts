
import { performance } from 'perf_hooks';

interface VoterData {
    id: string;
    leader_name?: string;
    'LÍDER'?: string;
    [key: string]: any;
}

function generateData(voterCount: number, leaderCount: number): VoterData[] {
    const voters: VoterData[] = [];
    for (let i = 0; i < voterCount; i++) {
        const leaderIndex = Math.floor(Math.random() * leaderCount);
        voters.push({
            id: `voter-${i}`,
            leader_name: `Leader ${leaderIndex}`,
            'LÍDER': `Leader ${leaderIndex}`
        });
    }
    return voters;
}

function originalImplementation(voters: VoterData[]) {
    // 1. Get unique leaders
    const uniqueLeaders = new Set<string>();
    voters.forEach(v => {
        const name = v.leader_name || v['LÍDER'] || 'Sin Asignar';
        uniqueLeaders.add(name);
    });
    const leaders = Array.from(uniqueLeaders);

    // 2. Group voters (nested loop)
    const groups: Record<string, VoterData[]> = {};
    leaders.forEach(leader => {
        groups[leader] = voters.filter(v => (v.leader_name || v['LÍDER'] || 'Sin Asignar') === leader);
    });
    return groups;
}

function optimizedImplementation(voters: VoterData[]) {
    const groups: Record<string, VoterData[]> = {};
    voters.forEach(v => {
        const leader = v.leader_name || v['LÍDER'] || 'Sin Asignar';
        if (!groups[leader]) {
            groups[leader] = [];
        }
        groups[leader].push(v);
    });
    return groups;
}

async function runBenchmark() {
    console.log('Generating data...');
    const voterCount = 50000;
    const leaderCount = 200;
    const voters = generateData(voterCount, leaderCount);
    console.log(`Generated ${voterCount} voters and ${leaderCount} leaders.`);

    // --- Original ---
    console.log('Running Original Implementation...');
    const startOriginal = performance.now();
    const resultOriginal = originalImplementation(voters);
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;
    console.log(`Original Time: ${timeOriginal.toFixed(2)} ms`);

    // --- Optimized ---
    console.log('Running Optimized Implementation...');
    const startOptimized = performance.now();
    const resultOptimized = optimizedImplementation(voters);
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;
    console.log(`Optimized Time: ${timeOptimized.toFixed(2)} ms`);

    // --- Verification ---
    console.log('Verifying results...');
    const originalKeys = Object.keys(resultOriginal).sort();
    const optimizedKeys = Object.keys(resultOptimized).sort();

    if (JSON.stringify(originalKeys) !== JSON.stringify(optimizedKeys)) {
        console.error('Mismatch in keys!');
        console.log('Original:', originalKeys.length);
        console.log('Optimized:', optimizedKeys.length);
    } else {
        console.log('Keys match.');
        let match = true;
        for (const key of originalKeys) {
            if (resultOriginal[key].length !== resultOptimized[key].length) {
                console.error(`Mismatch in count for ${key}: ${resultOriginal[key].length} vs ${resultOptimized[key].length}`);
                match = false;
                break;
            }
        }
        if (match) console.log('All counts match. Logic is equivalent.');
    }

    console.log(`\nImprovement: ${(timeOriginal / timeOptimized).toFixed(2)}x faster`);
}

runBenchmark();
