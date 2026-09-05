{
  description = "Context Collapse - RUN.world game jam development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      rundot = pkgs.stdenvNoCC.mkDerivation {
        pname = "rundot";
        version = "7.14.3";
        src = pkgs.fetchurl {
          url = "https://github.com/series-ai/rundot-cli-releases/releases/download/v7.14.3/rundot-linux-x64.tar.gz";
          sha256 = "81f3b364a1d6c8ece97eca81c34a93ffcc6a61fdae6c994316e1a3dd87aa6382";
        };
        nativeBuildInputs = [ pkgs.autoPatchelfHook pkgs.makeWrapper ];
        buildInputs = [ pkgs.stdenv.cc.cc.lib pkgs.zlib pkgs.openssl pkgs.icu ];
        sourceRoot = ".";
        dontBuild = true;
        installPhase = ''
          runHook preInstall
          install -Dm755 rundot $out/bin/rundot
          wrapProgram $out/bin/rundot \
            --prefix LD_LIBRARY_PATH : "${pkgs.lib.makeLibraryPath [ pkgs.icu pkgs.openssl ]}"
          runHook postInstall
        '';
        meta.platforms = [ system ];
      };
    in {
      packages.${system}.rundot = rundot;
      devShells.${system}.default = pkgs.mkShell {
        packages = [ pkgs.nodejs_24 pkgs.git pkgs.curl pkgs.ripgrep pkgs.xdg-utils rundot ];
        shellHook = ''
          echo "Context Collapse environment ready: node, npm, rundot"
        '';
      };
    };
}
